// ============================================================
// /frontend/src/services/api.ts
// Typed API client for the ACOB Odyssey backend
// ============================================================
import axios, { AxiosInstance } from 'axios';
import type {
  DashboardData, CreditTokenRecord, CreditTokenRequest,
  TokenResponse, HourlyMeterData, SiteId, ApiResponse,
  AmrResponse, AccountReadRequest, CustomerReadRequest,
  DailyDataMeterReadRequest, TokenCreditTokenRecordReadRequest
} from '@common/types/odyssey';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

class ApiClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.response.use(
      (res: any) => res,
      (err: any) => {
        const msg = err.response?.data?.error ?? err.response?.data?.reason ?? err.message ?? 'Network error';
        return Promise.reject(new Error(msg));
      }
    );
  }

  /**
   * Helper for AMR API V1 POST endpoints
   */
  private async amrPost<T>(url: string, data?: any): Promise<{ total: number; data: T }> {
    const res = await this.http.post<AmrResponse<{ total: number; data: T }>>(url, data);
    if (res.data.code !== 0) {
      throw new Error(res.data.reason || 'API Error');
    }
    return res.data.result;
  }

  /**
   * Helper for AMR API V1 generic responses (non-list)
   */
  private async amrPostGeneric<T>(url: string, data?: any): Promise<T> {
    const res = await this.http.post<AmrResponse<T>>(url, data);
    if (res.data.code !== 0) {
      throw new Error(res.data.reason || 'API Error');
    }
    return res.data.result;
  }

  // ── AMR API V1 Functional Groups ───────────────────────────

  account = {
    read: (req: AccountReadRequest) => this.amrPost<any[]>('/account/read', req),
    create: (data: any) => this.amrPostGeneric<any>('/account/create', data),
    update: (data: any) => this.amrPostGeneric<any>('/account/update', data),
    delete: (ids: string[]) => this.amrPostGeneric<any>('/account/delete', ids),
  };

  customer = {
    read: (req: CustomerReadRequest) => this.amrPost<any[]>('/customer/read', req),
    create: (data: any) => this.amrPostGeneric<any>('/customer/create', data),
    update: (data: any) => this.amrPostGeneric<any>('/customer/update', data),
    delete: (ids: string[]) => this.amrPostGeneric<any>('/customer/delete', ids),
  };

  dashboard = {
    readPanelGroup: (item: string = '0') => this.amrPostGeneric<any>('/dashboard/readPanelGroup', { item }),
    readLineChart: (req: any = {}) => this.amrPostGeneric<any>('/dashboard/readLineChart', req),
  };

  dailyDataMeter = {
    read: (req: DailyDataMeterReadRequest) => this.amrPost<any[]>('/DailyDataMeter/read', req),
    readHourly: (params: any) => this.http.get<any>('/DailyDataMeter/readHourly', { params }).then((r: any) => r.data),
  };

  token = {
    generateCredit: (data: any) => this.amrPostGeneric<any>('/token/creditToken/generate', data),
    readCreditRecords: (req: TokenCreditTokenRecordReadRequest) => this.amrPost<any[]>('/token/creditTokenRecord/read', req),
  };

  gprsMeterTask = {
    createReading: (data: any) => this.amrPostGeneric<any>('/GPRSMeterTask/GPRSCreateReadingTask', data),
    createControl: (data: any) => this.amrPostGeneric<any>('/GPRSMeterTask/GPRSCreateControlTask', data),
    getReading: (req: any) => this.amrPost<any[]>('/GPRSMeterTask/GPRSGetReadingTask', req),
  };

  station = {
    read: (req: any = {}) => this.amrPost<any[]>('/station/read', req),
  };

  gateway = {
    read: (req: any = {}) => this.amrPost<any[]>('/gateway/read', req),
  };

  tariff = {
    read: (req: any = {}) => this.amrPost<any[]>('/tariff/read', req),
  };

  user = {
    info: () => this.amrPostGeneric<any>('/user/info', {}),
  };

  // ── Legacy Methods (For compatibility) ─────────────────────
  async getDashboard(from: string, to: string, siteId?: SiteId): Promise<DashboardData> {
    const res = await this.http.get<ApiResponse<DashboardData>>('/dashboard', {
      params: { from, to, ...(siteId && { siteId }) },
    });
    return res.data.data!;
  }

  async getHourlyData(siteId: SiteId | 'ALL', from: string, to: string) {
    const res = await this.http.get<ApiResponse<HourlyMeterData[]>>('/dashboard/hourly', {
      params: { siteId, from, to },
    });
    return res.data.data ?? [];
  }

  async getGprsStatus() {
    const res = await this.http.get<ApiResponse<any[]>>('/dashboard/gprs');
    return res.data.data ?? [];
  }

  async getEvents(from: string, to: string, siteId?: SiteId) {
    const res = await this.http.get<ApiResponse<any[]>>('/dashboard/events', {
      params: { from, to, ...(siteId && { siteId }) },
    });
    return res.data.data ?? [];
  }

  async generateCreditToken(req: CreditTokenRequest): Promise<TokenResponse> {
    const res = await this.http.post<ApiResponse<TokenResponse>>('/tokens/credit', req);
    return res.data.data!;
  }

  async generateClearTamperToken(meterSN: string, siteId: SiteId, operatorId: string) {
    const res = await this.http.post<ApiResponse<any>>('/tokens/clear-tamper', {
      meterSN, siteId, operatorId
    });
    return res.data.data;
  }

  async generateClearCreditToken(meterSN: string, siteId: SiteId, operatorId: string) {
    const res = await this.http.post<ApiResponse<any>>('/tokens/clear-credit', {
      meterSN, siteId, operatorId
    });
    return res.data.data;
  }

  async generateMaxPowerToken(meterSN: string, siteId: SiteId, limitKw: number, operatorId: string) {
    const res = await this.http.post<ApiResponse<any>>('/tokens/max-power', {
      meterSN, siteId, limitKw, operatorId
    });
    return res.data.data;
  }

  async getTokenRecords(
    siteId: SiteId | 'ALL',
    from: string,
    to: string
  ): Promise<CreditTokenRecord[]> {
    const res = await this.http.get<ApiResponse<CreditTokenRecord[]> & { total: number }>(
      '/tokens/records',
      { params: { siteId, from, to } }
    );
    return res.data.data ?? [];
  }

  async getDiagnostics() {
    const res = await this.http.get<any>('/diagnostics/run-probe');
    return res.data;
  }

  // ── Generic ───────────────────────────────────────────────
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const res = await this.http.get<ApiResponse<T>>(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const res = await this.http.post<ApiResponse<T>>(url, data, config);
    return res.data;
  }
}

export const apiClient = new ApiClient();
