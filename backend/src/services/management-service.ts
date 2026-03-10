// ============================================================
// /backend/src/services/management-service.ts
// Gateway, Customer, Tariff, Account CRUD operations
// Uses correct POST endpoints discovered from Odyssey API
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import { config } from '../config';
import type { SiteId } from '../../../common/types/odyssey';
import { tokenDataEngine } from './token-data-engine';

// ════════════════════════════════════════════════════════════
// ANALYTICS — Token Data Engine
// ════════════════════════════════════════════════════════════
export async function getConsumptionAnalytics(filters?: { siteId?: string; meterSN?: string }) {
  return tokenDataEngine.getConsumptionAnalytics(filters);
}

export async function getMeterConsumptionAnalytics(filters?: { siteId?: string }) {
  return tokenDataEngine.getMeterConsumptionAnalytics(filters);
}

// ════════════════════════════════════════════════════════════
// GATEWAY — POST /gateway/read
// ════════════════════════════════════════════════════════════
export async function listGateways(siteId?: SiteId) {
  try {
    const res = await odysseyClient.post<any>('/gateway/read', {
      ...(siteId ? { SITE_ID: siteId } : {}),
      pageSize: 100000,
      pageNum: 1
    });
    const gateways = res?.result?.data ?? [];
    return gateways.map((g: any) => ({
      id: g.gatewayId || g.id,
      name: g.name || g.gatewayId,
      siteId: g.stationId || g.siteId || 'Unknown',
      ipAddress: g.ipAddress || g.ip || '',
      status: g.status ?? true,
      createDate: g.createDate,
      updateDate: g.updateDate,
      remark: g.remark,
    }));
  } catch (err: any) {
    logger.warn('Gateway read failed, trying engine', { error: err.message });
    const gateways = await tokenDataEngine.fetchGateways();
    return gateways.map((g: any) => ({
      id: g.gatewayId || g.id,
      name: g.name || g.gatewayId,
      siteId: g.stationId || 'Unknown',
      ipAddress: g.ipAddress || '',
      status: g.status ?? true,
      createDate: g.createDate,
      updateDate: g.updateDate,
      remark: g.remark,
    }));
  }
}

export async function getGateway(id: string, siteId: SiteId) {
  return odysseyClient.post<any>('/gateway/read', { SITE_ID: siteId, gatewayId: id });
}

export async function createGateway(payload: {
  name: string;
  siteId: SiteId;
  ipAddress: string;
  protocol: string;
  location: string;
  notes?: string;
}) {
  logger.info('Creating gateway', { siteId: payload.siteId, name: payload.name });
  return odysseyClient.post<any>('/gateway/create', {
    name: payload.name,
    SITE_ID: payload.siteId,
    ipAddress: payload.ipAddress,
    protocol: payload.protocol,
    location: payload.location,
    remark: payload.notes,
  });
}

export async function updateGateway(id: string, payload: Partial<{
  name: string; ipAddress: string; protocol: string; location: string; notes: string;
}>, siteId: SiteId) {
  logger.info('Updating gateway', { id, siteId });
  return odysseyClient.post<any>('/gateway/update', { gatewayId: id, ...payload, SITE_ID: siteId });
}

export async function deleteGateway(id: string, siteId: SiteId) {
  logger.warn('Decommissioning gateway', { id, siteId });
  return odysseyClient.post<any>('/gateway/delete', { gatewayId: id, SITE_ID: siteId });
}

// ════════════════════════════════════════════════════════════
// CUSTOMER — Direct Odyssey API
// ════════════════════════════════════════════════════════════
export async function listCustomers(page: number = 1, limit: number = 20, search?: string) {
  try {
    // 1. Fetch all accounts to get the list of customers paired with a meter
    const res = await odysseyClient.post<any>('/account/read', {
      pageNum: 1,
      pageIndex: 1,
      pageLimit: 100000,
      pageSize: 100000
    });
    const accounts = res?.result?.data ?? [];

    // 2. Extract unique paired customers
    const uniqueCustomerIds = new Set<string>();
    const pairedCustomers: any[] = [];

    for (const acc of accounts) {
      if (!acc.customerId) continue;
      if (!uniqueCustomerIds.has(acc.customerId)) {
        uniqueCustomerIds.add(acc.customerId);
        pairedCustomers.push({
          id: acc.customerId,
          name: acc.customerName || 'Unknown',
          phone: null,
          address: null, // Full demographics aren't returned by /account/read, would need separate calls
          identityType: 'Paired Meter SN',
          identityNumber: acc.meterId || acc.customerId,
          createDate: acc.createDate || acc.createdAt || new Date().toISOString(),
        });
      }
    }

    // Sort alphabetically
    pairedCustomers.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by search
    let filtered = pairedCustomers;
    if (search) {
      const q = search.toLowerCase();
      filtered = pairedCustomers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.identityNumber && c.identityNumber.toLowerCase().includes(q))
      );
    }

    // Paginate
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return { data: paginated, total };
  } catch (err: any) {
    logger.error('Failed to list paired customers', { error: err.message });
    return { data: [], total: 0 };
  }
}

export async function getCustomer(id: string, siteId: SiteId) {
  const details = await tokenDataEngine.getCustomerDetails(id);
  return details;
}

export async function createCustomer(payload: {
  name: string;
  phone?: string;
  address?: string;
  identityType?: string;
  identityNumber?: string;
}) {
  logger.info('Registering new customer profile', { name: payload.name });
  return odysseyClient.post<any>('/customer/create', {
    customerName: payload.name,
    phone: payload.phone || '',
    address: payload.address || '',
    certifiName: payload.identityType || '',
    certifiNo: payload.identityNumber || '',
  });
}

export async function updateCustomer(id: string, payload: Partial<{
  name: string; phone: string; address: string; identityType: string; identityNumber: string;
}>) {
  logger.info('Updating customer profile', { id });
  return odysseyClient.post<any>('/customer/update', {
    customerId: id,
    customerName: payload.name,
    phone: payload.phone,
    address: payload.address,
    certifiName: payload.identityType,
    certifiNo: payload.identityNumber,
  });
}

// ════════════════════════════════════════════════════════════
// TARIFF — POST /tariff/read
// ════════════════════════════════════════════════════════════
export async function listTariffs(siteId?: SiteId) {
  try {
    const tariffs = await tokenDataEngine.fetchTariffs();
    return tariffs.map((t: any) => ({
      id: t.tariffId,
      name: t.tariffName || t.tariffId,
      siteId: t.stationId || 'All Sites',
      ratePerKwh: parseFloat(t.price) || 0,
      tax: t.tax || 0,
      createDate: t.createDate,
      updateDate: t.updateDate,
      remark: t.remark,
    }));
  } catch (err: any) {
    logger.error('Tariff read failed', { error: err.message });
    return [];
  }
}

export async function getTariff(id: string, siteId: SiteId) {
  return odysseyClient.post<any>('/tariff/read', { tariffId: id, SITE_ID: siteId });
}

export async function createTariff(payload: {
  name: string;
  siteId: SiteId;
  ratePerKwh: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  approvedBy: string;
}) {
  logger.info('Creating tariff', { siteId: payload.siteId, rate: payload.ratePerKwh });
  return odysseyClient.post<any>('/tariff/create', {
    tariffName: payload.name,
    stationId: payload.siteId,
    price: String(payload.ratePerKwh),
    tax: 0,
  });
}

export async function updateTariff(id: string, payload: Partial<{
  ratePerKwh: number; effectiveTo: string; name: string; approvedBy: string;
}>, siteId: SiteId) {
  logger.info('Updating tariff', { id, siteId, rate: payload.ratePerKwh });
  return odysseyClient.post<any>('/tariff/update', {
    tariffId: id,
    tariffName: payload.name,
    price: payload.ratePerKwh ? String(payload.ratePerKwh) : undefined,
    stationId: siteId,
  });
}

// ════════════════════════════════════════════════════════════
// ACCOUNT (Prepaid Billing Accounts) — POST /api/account/read
// ════════════════════════════════════════════════════════════
export async function listAccounts(page: number = 1, limit: number = 20) {
  try {
    // Official path: /api/account/read (ignores offset, so we pull all and paginate in memory)
    const res = await odysseyClient.post<any>('/account/read', {
      pageNum: 1,
      pageIndex: 1,
      pageLimit: 100000,
      pageSize: 100000
    });

    const raw = res?.result?.data ?? [];

    // In-memory pagination
    const total = raw.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = raw.slice(startIndex, endIndex);

    // Map raw API fields to PrepaidAccount interface
    const data = paginated.map((a: any) => ({
      id: a.customerId || a.id || a.username,
      customerId: a.customerId || '',
      customerName: a.customerName || '',
      meterId: a.meterId || '',
      tariffId: a.tariffId || '',
      status: typeof a.status === 'boolean' ? a.status : false,
      createDate: a.createDate || a.createdAt || '',
    }));

    return { data, total };
  } catch (err: any) {
    logger.error('Account read failed', { error: err.message });
    return { data: [], total: 0 };
  }
}

export async function getAccount(id: string) {
  return odysseyClient.post<any>('/account/read', { accountId: id });
}

export async function createAccount(payload: {
  customerId: string;
  meterId: string;
  tariffId: string;
  customerName?: string;
}) {
  logger.info('Provisioning prepaid account', { customerId: payload.customerId, meterId: payload.meterId });
  return odysseyClient.post<any>('/account/create', {
    customerId: payload.customerId,
    customerName: payload.customerName || '',
    meterId: payload.meterId,
    tariffId: payload.tariffId,
  });
}

export async function updateAccount(id: string, payload: Partial<{
  customerId: string; meterId: string; tariffId: string; active: boolean;
}>) {
  logger.info('Updating prepaid account', { id });
  return odysseyClient.post<any>('/account/update', { accountId: id, ...payload });
}

export async function deactivateAccount(id: string, revokedBy: string) {
  logger.warn('Deactivating account', { id, revokedBy });
  return odysseyClient.post<any>('/account/delete', { accountId: id });
}
