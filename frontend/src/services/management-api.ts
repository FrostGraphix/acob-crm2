// ============================================================
// /frontend/src/services/management-api.ts
// Typed API client for the Management module
// ============================================================
import axios, { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const http: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/management`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.error ?? err.message ?? 'Network error'))
);

// ── Types ─────────────────────────────────────────────────────
export interface Gateway {
  id: string;
  name: string;
  siteId: string;
  ipAddress: string;
  protocol: 'GPRS' | 'Ethernet' | 'WiFi' | 'RS485' | 'LoRa';
  location: string;
  notes?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  connectedMeters?: number;
  lastSeen?: string;
  installedAt?: string;
}

export interface CustomerProfile {
  id: string; // customerId
  name: string; // customerName
  phone: string | null;
  address: string | null;
  identityType: string | null; // certifiName
  identityNumber: string | null; // certifiNo
  createDate: string;
}

export interface CustomerFullDetails {
  customer: CustomerProfile;
  purchaseHistory: any[];
  energyUsage: any[];
  stats: {
    totalSpent: number;
    rechargeCount: number;
    totalKwh: number;
    lastRechargeDate?: string;
  };
}

export interface Tariff {
  id: string;
  name: string;
  siteId: string;
  ratePerKwh: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  approvedBy: string;
  active?: boolean;
}

export interface PrepaidAccount {
  id: string;
  customerId: string;
  customerName: string;
  meterId: string;
  tariffId: string;
  status: boolean;
  createDate?: string;
}

// ── Gateway API ───────────────────────────────────────────────
export const gatewayApi = {
  list: async (siteId?: string): Promise<Gateway[]> => {
    const res = await http.get('/gateways', { params: siteId ? { siteId } : {} });
    return res.data.data ?? [];
  },
  create: async (payload: Omit<Gateway, 'id' | 'status' | 'connectedMeters' | 'lastSeen' | 'installedAt'>): Promise<Gateway> => {
    const res = await http.post('/gateways', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<Gateway>): Promise<Gateway> => {
    const res = await http.put(`/gateways/${id}`, payload);
    return res.data.data;
  },
  remove: async (id: string, siteId: string): Promise<void> => {
    await http.delete(`/gateways/${id}`, { params: { siteId } });
  },
};

// ── Customer API (Demographic CRM) ──────────────────────────────
export const customerApi = {
  list: async (page: number = 1, limit: number = 20, search?: string): Promise<{ data: CustomerProfile[], total: number }> => {
    const res = await http.get('/customers', { params: { page, limit, ...(search && { search }) } });
    return { data: res.data.data ?? [], total: res.data.total ?? 0 };
  },
  create: async (payload: Omit<CustomerProfile, 'id' | 'createDate'>): Promise<CustomerProfile> => {
    const res = await http.post('/customers', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<CustomerProfile>): Promise<CustomerProfile> => {
    const res = await http.put(`/customers/${id}`, payload);
    return res.data.data;
  },
  getDetails: async (id: string, siteId: string): Promise<CustomerFullDetails> => {
    const res = await http.get(`/customers/${id}/details`, { params: { siteId } });
    return res.data.data;
  },
};

// ── Tariff API ────────────────────────────────────────────────
export const tariffApi = {
  list: async (siteId?: string): Promise<Tariff[]> => {
    const res = await http.get('/tariffs', { params: siteId ? { siteId } : {} });
    return res.data.data ?? [];
  },
  create: async (payload: Omit<Tariff, 'id' | 'active'>): Promise<Tariff> => {
    const res = await http.post('/tariffs', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<Tariff>): Promise<Tariff> => {
    const res = await http.put(`/tariffs/${id}`, payload);
    return res.data.data;
  },
};

// ── Analytics API ──────────────────────────────────────────────
export interface DailyConsumptionAnalytics {
  date: string;
  dayKwh: number;
  nightKwh: number;
  dayRevenue: number;
  nightRevenue: number;
  dayTransactions: number;
  nightTransactions: number;
  totalKwh: number;
  totalRevenue: number;
}

export interface MeterConsumptionAnalytics {
  meterSN: string;
  customerName: string;
  siteId: string;
  dayKwh: number;
  nightKwh: number;
  totalKwh: number;
}

export const analyticsApi = {
  getConsumption: async (siteId?: string, meterSN?: string): Promise<DailyConsumptionAnalytics[]> => {
    const res = await http.get('/analytics/consumption', { params: { ...(siteId && { siteId }), ...(meterSN && { meterSN }) } });
    return res.data.data ?? [];
  },
  getMeterConsumption: async (siteId?: string): Promise<MeterConsumptionAnalytics[]> => {
    const res = await http.get('/analytics/meter-consumption', { params: { ...(siteId && { siteId }) } });
    return res.data.data ?? [];
  }
};

// ── Stats API (aggregate KPIs) ────────────────────────────────
export interface MeterStats {
  totalMeters: number;
  activeMeters: number;
  inactiveMeters: number;
  totalKwh: number;
  dayKwh: number;
  nightKwh: number;
  totalRevenue: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
}

export const statsApi = {
  getMeterStats: async (siteId?: string): Promise<MeterStats> => {
    const res = await http.get('/stats/meters', { params: siteId ? { siteId } : {} });
    return res.data.data;
  },
  getCustomerStats: async (siteId?: string): Promise<CustomerStats> => {
    const res = await http.get('/stats/customers', { params: siteId ? { siteId } : {} });
    return res.data.data;
  },
};

// ── Prepaid Account API ───────────────────────────────────────
export const accountApi = {
  list: async (page: number = 1, limit: number = 20): Promise<{ data: PrepaidAccount[], total: number }> => {
    const res = await http.get('/accounts', { params: { page, limit } });
    return { data: res.data.data ?? [], total: res.data.total ?? 0 };
  },
  create: async (payload: Omit<PrepaidAccount, 'id' | 'createDate'>): Promise<PrepaidAccount> => {
    const res = await http.post('/accounts', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<PrepaidAccount>): Promise<PrepaidAccount> => {
    const res = await http.put(`/accounts/${id}`, payload);
    return res.data.data;
  },
  deactivate: async (id: string): Promise<void> => {
    await http.post(`/accounts/${id}/deactivate`, {});
  },
};

// ── Meter API ─────────────────────────────────────────────────
const metersHttp: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/meters`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});
metersHttp.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.error ?? err.message ?? 'Network error'))
);

export interface Meter {
  meterSN: string;
  siteId: string;
  customerName: string;
  accountNo: string;
  tariffRate: string;
  totalRevenue: number;
  totalKwh: number;
  transactionCount: number;
  firstSeen: string;
  lastSeen: string;
  lastAmount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MeterDetails {
  meter: Meter;
  recentTransactions: any[];
  consumption: { month: string; totalKwh: number; totalRevenue: number; transactionCount: number }[];
  totalTransactions: number;
}

export const meterApi = {
  list: async (siteId?: string): Promise<Meter[]> => {
    const res = await metersHttp.get('/', { params: siteId ? { siteId } : {} });
    return res.data.data ?? [];
  },
  getDetails: async (meterSN: string): Promise<MeterDetails> => {
    const res = await metersHttp.get(`/${meterSN}`);
    return res.data.data;
  },
  getConsumption: async (meterSN: string): Promise<any[]> => {
    const res = await metersHttp.get(`/${meterSN}/consumption`);
    return res.data.data ?? [];
  },
  getSiteStats: async (): Promise<Record<string, any>> => {
    const res = await metersHttp.get('/stats/sites');
    return res.data.data ?? {};
  },
  getNonPurchase: async (days?: number): Promise<Meter[]> => {
    const res = await metersHttp.get('/reports/non-purchase', { params: days ? { days } : {} });
    return res.data.data ?? [];
  },
  getLowPurchase: async (threshold?: number): Promise<Meter[]> => {
    const res = await metersHttp.get('/reports/low-purchase', { params: threshold ? { threshold } : {} });
    return res.data.data ?? [];
  },
};
