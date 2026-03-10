// ============================================================
// /frontend/src/services/reports-api.ts
// ============================================================
import axios from 'axios';
import type { SiteId } from '@common/types/odyssey';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const http = axios.create({ baseURL: `${BASE_URL}/reports`, timeout: 60_000 });
http.interceptors.response.use(r => r, err => Promise.reject(new Error(err.response?.data?.error ?? err.message)));

function params(obj: Record<string, any>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
}

export const reportsApi = {
  nonPurchase: async (siteId: SiteId | 'ALL', dayThreshold = 30) => {
    const res = await http.get('/non-purchase', { params: params({ siteId, dayThreshold }) });
    return res.data.data ?? [];
  },
  lowPurchase: async (siteId: SiteId | 'ALL', amountThreshold = 500) => {
    const res = await http.get('/low-purchase', { params: params({ siteId, amountThreshold }) });
    return res.data.data ?? [];
  },
  consumption: async (siteId: SiteId | 'ALL', from: string, to: string) => {
    const res = await http.get('/consumption', { params: params({ siteId, from, to }) });
    return res.data.data ?? [];
  },
  dailyAmr: async (siteId: SiteId | 'ALL', from: string, to: string) => {
    const res = await http.get('/daily-amr', { params: params({ siteId, from, to }) });
    return res.data.data ?? [];
  },
  monthlyAmr: async (siteId: SiteId | 'ALL', from: string, to: string) => {
    const res = await http.get('/monthly-amr', { params: params({ siteId, from, to }) });
    return res.data.data ?? [];
  },
  dailyYield: async (siteId: SiteId | 'ALL', from: string, to: string) => {
    const res = await http.get('/daily-yield', { params: params({ siteId, from, to }) });
    return res.data.data ?? [];
  },
  monthlyYield: async (siteId: SiteId | 'ALL', from: string, to: string) => {
    const res = await http.get('/monthly-yield', { params: params({ siteId, from, to }) });
    return res.data.data ?? [];
  },
  events: async (siteId: SiteId | 'ALL', from: string, to: string, eventType?: string) => {
    const res = await http.get('/events', { params: params({ siteId, from, to, eventType }) });
    return res.data.data ?? [];
  },
  energyCurveSingle: async (siteId: SiteId, meterSN: string, from: string, to: string) => {
    const res = await http.get('/energy-curve/single', { params: { siteId, meterSN, from, to } });
    return res.data.data ?? [];
  },
  instantaneous: async (siteId: SiteId, meterSN: string) => {
    const res = await http.get('/instantaneous', { params: { siteId, meterSN } });
    return res.data.data ?? null;
  },
  // CSV export — returns download URL
  exportCsv: (endpoint: string, queryParams: Record<string, any>) => {
    const p = new URLSearchParams({ ...queryParams, format: 'csv' }).toString();
    return `${BASE_URL}/reports/${endpoint}?${p}`;
  },
};
