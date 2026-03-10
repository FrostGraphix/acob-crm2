// ============================================================
// /backend/src/services/odyssey-client.ts
// Core HTTP client for the Odyssey API
// Handles: JWT auth, retry with exponential backoff, pagination
// ============================================================
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';
import type { SiteId, PaginatedResponse } from '../../../common/types/odyssey';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

class OdysseyClient {
  private http: AxiosInstance;
  private cache = new Map<string, { timestamp: number, data: any }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.http = axios.create({
      baseURL: config.odyssey.baseUrl,
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.odyssey.jwtToken}`,
      },
    });

    // Request interceptor — log every outgoing call
    this.http.interceptors.request.use((req) => {
      // SOP 11.1 #4: Correlation IDs for complete audit trails
      const crypto = require('crypto');
      const correlationId = crypto.randomUUID();
      req.headers['X-Correlation-ID'] = correlationId;
      (req as any)._correlationId = correlationId; // Attach for response interceptor

      logger.debug(`Odyssey API request [${correlationId}]`, {
        method: req.method?.toUpperCase(),
        url: req.url,
        params: req.params,
      });
      return req;
    });

    // Response interceptor — log errors
    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        const cid = err.config?._correlationId ? `[${err.config._correlationId}] ` : '';
        logger.error(`Odyssey API error ${cid}`, {
          status: err.response?.status,
          url: err.config?.url,
          message: err.message,
        });
        return Promise.reject(err);
      }
    );
  }

  // ── Token Validation (SOP 2.2) ────────────────────────────
  private validateToken(): boolean {
    if (!config.odyssey.jwtToken) return false;
    try {
      // Split and decode JWT payload
      const parts = config.odyssey.jwtToken.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('ascii'));

      // SOP 2.2: Validate token exp claim, refresh proactively 60s before expiry
      if (payload.exp) {
        const expMs = payload.exp * 1000;
        const nowMs = Date.now();
        const bufferMs = (Number(process.env.ODYSSEY_TOKEN_EXPIRY_BUFFER_SECONDS) || 60) * 1000;

        if (nowMs > (expMs - bufferMs)) {
          logger.error('Odyssey API: JWT Token expired or expiring within 60s buffer!', {
            exp: new Date(expMs).toISOString(),
            now: new Date(nowMs).toISOString()
          });
          return false;
        }
      }
      return true;
    } catch (err) {
      logger.error('Odyssey API: Failed to parse JWT Token', err);
      return false;
    }
  }

  // ── Core request with exponential backoff retry ───────────
  private async request<T>(axiosConfig: AxiosRequestConfig, attempt = 1): Promise<T> {
    // 1. JWT Security Validation
    if (!this.validateToken()) {
      throw new Error('Odyssey API: JWT Bearer Token missing, malformed, or expired. Refusing to send request.');
    }
    const isReadEndpoint = axiosConfig.url && (
      axiosConfig.url.toLowerCase().includes('read') ||
      axiosConfig.url.toLowerCase().includes('report') ||
      axiosConfig.url.toLowerCase().includes('dashboard') ||
      axiosConfig.url.toLowerCase().includes('statistics')
    ) && !axiosConfig.url.toLowerCase().includes('generate')
      && !axiosConfig.url.toLowerCase().includes('create')
      && !axiosConfig.url.toLowerCase().includes('update')
      && !axiosConfig.url.toLowerCase().includes('delete');

    const cacheKey = isReadEndpoint ? `${axiosConfig.method}:${axiosConfig.url}:${JSON.stringify(axiosConfig.params || {})}:${JSON.stringify(axiosConfig.data || {})}` : null;

    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Odyssey API cache hit', { url: axiosConfig.url });
        return cached.data;
      }
    }

    try {
      const res = await this.http.request<T>(axiosConfig);
      if (cacheKey) {
        this.cache.set(cacheKey, { timestamp: Date.now(), data: res.data });
      }
      return res.data;
    } catch (err: any) {
      const status = err.response?.status;

      // Don't retry client errors (4xx) except 429
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }

      if (attempt >= MAX_RETRIES) {
        logger.error(`Odyssey API: max retries (${MAX_RETRIES}) reached`, { url: axiosConfig.url });
        throw err;
      }

      const delay = Math.pow(2, attempt) * BASE_DELAY_MS;
      logger.warn(`Odyssey API: retry ${attempt}/${MAX_RETRIES} in ${delay}ms`, { url: axiosConfig.url });
      await new Promise(r => setTimeout(r, delay));
      return this.request<T>(axiosConfig, attempt + 1);
    }
  }

  // ── GET helper ────────────────────────────────────────────
  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return this.request<T>({ method: 'GET', url: path, params, ...config });
  }

  // ── POST helper ───────────────────────────────────────────
  async post<T>(
    path: string,
    data?: unknown,
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return this.request<T>({ method: 'POST', url: path, data, ...config });
  }

  // ── Robust array extraction helper ────────────────────────
  private extractArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];

    // Prioritize known Odyssey array keys
    const priorityKeys = ['payments', 'readings', 'records', 'events', 'data', 'Data', 'items', 'meter', 'customer'];
    for (const key of priorityKeys) {
      if (Array.isArray(data[key])) return data[key];
    }

    // Fallback: find any array property
    const fallbackKey = Object.keys(data).find(k => Array.isArray(data[k]));
    return fallbackKey ? data[fallbackKey] : [];
  }

  // ── Fetch ALL pages for a paginated endpoint (GET) ────────
  async fetchAllPages<T>(
    path: string,
    params: Record<string, unknown>,
    pageLimit = 100,
    maxPages = 50 // Default safety limit (5000 records)
  ): Promise<T[]> {
    let offset = 0;
    const allData: T[] = [];
    let lastPageJson = '';
    let pageCount = 0;

    while (pageCount < maxPages) {
      try {
        const res = await this.get<any>(path, { ...params, offset, pageLimit });
        const page = this.extractArray<T>(res);

        // Safety: If we get the same data twice, the server ignores offset
        const currentJson = JSON.stringify(page);
        if (page.length > 0 && currentJson === lastPageJson) {
          logger.warn(`Odyssey API: detected infinite loop at offset ${offset} - server may be ignoring offset`, { path });
          break;
        }
        lastPageJson = currentJson;

        allData.push(...page);
        if (page.length < pageLimit) break; // last page
        offset += pageLimit;
        pageCount++;
      } catch (err) {
        logger.error(`Odyssey API: error fetching page at offset ${offset}`, { path, params });
        if (pageCount === 0) throw err; // If the very first request fails, propagate the error so fallbacks can activate
        break; // If subsequent pages fail, return what we have so far
      }
    }

    if (pageCount >= maxPages && maxPages > 1) {
      logger.warn(`Odyssey API: reached page limit (${maxPages})`, { path });
    }

    return allData;
  }

  // ── Fetch ALL pages for a paginated endpoint (POST) ───────
  async fetchAllPagesPost<T>(
    path: string,
    data: Record<string, unknown>, // This will go to body
    pageLimit = 100,
    queryParams: Record<string, unknown> = {}, // This will go to query string
    maxPages = 50
  ): Promise<T[]> {
    let offset = 0;
    const allData: T[] = [];
    let pageCount = 0;

    while (pageCount < maxPages) {
      try {
        // NOTE: Some Odyssey POST endpoints require SITE_ID in the query string
        const res = await this.post<any>(path,
          { ...data, offset, pageLimit },
          { params: { ...queryParams, offset, pageLimit } }
        );
        const page = this.extractArray<T>(res);
        allData.push(...page);

        if (page.length < pageLimit) break;
        offset += pageLimit;
        pageCount++;
      } catch (err) {
        logger.error(`Odyssey API: error fetching POST page at offset ${offset}`, { path });
        if (pageCount === 0) throw err; // If the very first request fails, propagate the error so fallbacks can activate
        break;
      }
    }

    return allData;
  }

  // ── Fetch ALL pages for a paginated endpoint (POST with pageNum) ──
  async fetchAllPagesPostPageNum<T>(
    path: string,
    data: Record<string, unknown>, // This will go to body
    pageLimit = 100,
    queryParams: Record<string, unknown> = {}, // This will go to query string
    maxPages = 50
  ): Promise<T[]> {
    let pageNum = 1;
    const allData: T[] = [];

    while (pageNum <= maxPages) {
      try {
        const res = await this.post<any>(path,
          { ...data, pageNum, pageLimit },
          { params: queryParams }
        );

        let page: T[] = [];
        let totalRecords: number | undefined;

        if (res?.result?.data && Array.isArray(res.result.data)) {
          page = res.result.data;
          totalRecords = res.result.total;
        } else {
          page = this.extractArray<T>(res);
          totalRecords = res?.total ?? res?.result?.total;
        }

        allData.push(...page);

        if (page.length === 0) break;

        if (typeof totalRecords === 'number') {
          if (allData.length >= totalRecords) break;
        } else {
          // Fallback if no total is provided:
          // If the page length is less than requested AND not a common forced limit (20, 50, etc), it's likely the end.
          const commonLimits = [10, 20, 50, 100, 200, 500, 1000];
          if (page.length < pageLimit && !commonLimits.includes(page.length)) {
            break;
          }
        }

        pageNum++;
      } catch (err) {
        logger.error(`Odyssey API: error fetching POST pageNum ${pageNum}`, { path });
        if (pageNum === 1) throw err;
        break;
      }
    }

    return allData;
  }

  // ── Multi-site parallel fetch ─────────────────────────────
  async fetchAllSites<T>(
    path: string,
    params: Omit<Record<string, unknown>, 'SITE_ID'> = {},
    method: 'GET' | 'POST' = 'GET',
    maxPages = 50
  ): Promise<{ siteId: SiteId; data: T[] }[]> {
    const results = await Promise.allSettled(
      config.odyssey.sites.map(async (siteId) => {
        const data = method === 'GET'
          ? await this.fetchAllPages<T>(path, { ...params, SITE_ID: siteId }, 100, maxPages)
          : await this.fetchAllPagesPost<T>(path, params, 100, { SITE_ID: siteId }, maxPages);
        return { siteId, data };
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<{ siteId: SiteId; data: T[] }> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  // ════════════════════════════════════════════════════════════
  // CREDIT TOKEN RECORDS
  // ════════════════════════════════════════════════════════════
  async getCreditTokenRecords(siteId: SiteId, from: string, to: string) {
    return this.get<any>(
      '/token/creditTokenRecord/readMore',
      { SITE_ID: siteId, FROM: from, TO: to }
    );
  }

  async getClearTamperTokenRecords(siteId: SiteId, from: string, to: string) {
    return this.get<any>(
      '/token/clearTamperTokenRecord/readMore',
      { SITE_ID: siteId, FROM: from, TO: to }
    );
  }

  async getClearCreditTokenRecords(siteId: SiteId, from: string, to: string) {
    return this.get<any>(
      '/token/clearCreditTokenRecord/readMore',
      { SITE_ID: siteId, FROM: from, TO: to }
    );
  }

  async getSetMaxPowerTokenRecords(siteId: SiteId, from: string, to: string) {
    return this.get<any>(
      '/token/setMaximumPowerLimitTokenRecord/readMore',
      { SITE_ID: siteId, FROM: from, TO: to }
    );
  }

  async getAllSitesCreditTokenRecords(from: string, to: string) {
    const results = await Promise.allSettled(
      config.odyssey.sites.map(async (siteId) => ({
        siteId,
        data: await this.getCreditTokenRecords(siteId, from, to)
      }))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<{ siteId: SiteId; data: any[] }> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  // ════════════════════════════════════════════════════════════
  // HOURLY METER DATA
  // ════════════════════════════════════════════════════════════
  async getHourlyData(siteId: SiteId, from: string, to: string) {
    return this.fetchAllPages<any>(
      '/DailyDataMeter/readHourly',
      { SITE_ID: siteId, FROM: from, TO: to }
    );
  }

  async getAllSitesHourlyData(from: string, to: string) {
    return this.fetchAllSites<any>('/DailyDataMeter/readHourly', { FROM: from, TO: to });
  }

  // ════════════════════════════════════════════════════════════
  // TOKEN GENERATION
  // ════════════════════════════════════════════════════════════
  async generateCreditToken(payload: {
    MeterSN: string;
    Amount: number;
    TariffRate: number;
    SITE_ID: SiteId;
    OperatorId: string;
  }) {
    // Official path: /api/token/creditToken/generate
    return this.post<any>('/token/creditToken/generate', payload);
  }

  async generateClearTamperToken(meterSN: string, siteId: SiteId, operatorId: string) {
    return this.post<any>('/token/clearTamperToken/generate', { MeterSN: meterSN, SITE_ID: siteId, OperatorId: operatorId });
  }

  async generateClearCreditToken(meterSN: string, siteId: SiteId, operatorId: string) {
    return this.post<any>('/token/clearCreditToken/generate', { MeterSN: meterSN, SITE_ID: siteId, OperatorId: operatorId });
  }

  async generateMaxPowerToken(meterSN: string, siteId: SiteId, limitKw: number, operatorId: string) {
    return this.post<any>('/token/setMaximumPowerLimitToken/generate', {
      MeterSN: meterSN, SITE_ID: siteId, PowerLimit: limitKw, OperatorId: operatorId
    });
  }

  // ════════════════════════════════════════════════════════════
  // REMOTE TASKS
  // ════════════════════════════════════════════════════════════
  async createReadingTask(meterSN: string, siteId: SiteId) {
    return this.post<any>('/RemoteMeterTask/CreateReadingTask', {
      MeterSN: meterSN, SITE_ID: siteId, ReadingType: 'INSTANT'
    });
  }

  async getReadingTaskResult(taskId: string, siteId: SiteId) {
    return this.post<any>('/RemoteMeterTask/GetReadingTask', { TaskId: taskId, SITE_ID: siteId });
  }

  // Task overrides missing from before
  async createControlTask(meterSN: string, siteId: SiteId, controlType: string) {
    return this.post<any>('/RemoteMeterTask/CreateControlTask', {
      MeterSN: meterSN, SITE_ID: siteId, ControlType: controlType
    });
  }

  async getControlTaskResult(taskId: string, siteId: SiteId) {
    return this.post<any>('/RemoteMeterTask/GetControlTask', { TaskId: taskId, SITE_ID: siteId });
  }

  async createTokenTask(meterSN: string, siteId: SiteId, token: string) {
    return this.post<any>('/RemoteMeterTask/CreateTokenTask', {
      MeterSN: meterSN, SITE_ID: siteId, Token: token
    });
  }

  async getTokenTaskResult(taskId: string, siteId: SiteId) {
    return this.post<any>('/RemoteMeterTask/GetTokenTask', { TaskId: taskId, SITE_ID: siteId });
  }

  async getReadingTasks(siteId: SiteId, from: string, to: string) {
    return this.post<any>('/RemoteMeterTask/ReadReadingTask', { FROM: from, TO: to }, { params: { SITE_ID: siteId } });
  }

  async getControlTasks(siteId: SiteId, from: string, to: string) {
    return this.post<any>('/RemoteMeterTask/ReadControlTask', { FROM: from, TO: to }, { params: { SITE_ID: siteId } });
  }

  async getTokenTasks(siteId: SiteId, from: string, to: string) {
    return this.post<any>('/RemoteMeterTask/ReadTokenTask', { FROM: from, TO: to }, { params: { SITE_ID: siteId } });
  }

  // ════════════════════════════════════════════════════════════
  // REPORTS
  // ════════════════════════════════════════════════════════════
  async getLongNonPurchase(siteId: SiteId, dayThreshold = 30) {
    return this.fetchAllPagesPost<any>(
      '/PrepayReport/LongNonpurchaseSituation',
      { DayThreshold: dayThreshold },
      100,
      { SITE_ID: siteId }
    );
  }

  async getLowPurchase(siteId: SiteId, amountThreshold = 500) {
    return this.fetchAllPagesPost<any>(
      '/PrepayReport/LowPurchaseSituation',
      { AmountThreshold: amountThreshold },
      100,
      { SITE_ID: siteId }
    );
  }

  async getConsumptionStatistics(siteId: SiteId, from: string, to: string) {
    return this.fetchAllPagesPost<any>(
      '/PrepayReport/ConsumptionStatistics',
      { FROM: from, TO: to },
      100,
      { SITE_ID: siteId }
    );
  }

  async getEventNotifications(siteId: SiteId, from: string, to: string) {
    return this.post<any>(
      '/EventNotification/Read',
      { FROM: from, TO: to },
      { params: { SITE_ID: siteId } }
    );
  }

  async getGprsStatus(siteId: SiteId) {
    return this.post<any>('/GPRSOnlineStatus/Read', { SITE_ID: siteId });
  }

  async getAllSitesGprsStatus() {
    return Promise.allSettled(
      config.odyssey.sites.map(async (siteId) => ({
        siteId,
        data: await this.getGprsStatus(siteId),
      }))
    );
  }

  // ════════════════════════════════════════════════════════════
  // NATIVE DASHBOARD
  // ════════════════════════════════════════════════════════════
  async getDashboardPanelGroup(siteId: SiteId) {
    return this.post<any>('/dashboard/readPanelGroup', { SITE_ID: siteId });
  }

  async getDashboardLineChart(siteId: SiteId, from: string, to: string) {
    return this.post<any>('/dashboard/readLineChart', { SITE_ID: siteId, FROM: from, TO: to });
  }

  async getAllSitesDashboardPanels() {
    return Promise.allSettled(
      config.odyssey.sites.map(async (siteId) => ({
        siteId,
        data: await this.getDashboardPanelGroup(siteId),
      }))
    );
  }
}

// Singleton export
export const odysseyClient = new OdysseyClient();
