// ============================================================
// /backend/src/services/token-data-engine.ts
// Central data engine that mines Credit Token Records to derive
// Meter, Customer, Revenue, Energy, and Purchase History data.
// This is the SINGLE SOURCE OF TRUTH for the ACOB Odyssey CRM
// since only /token/creditTokenRecord/readMore returns live data.
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import { config } from '../config';
import type { SiteId } from '../../../common/types/odyssey';

// ── Derived Entity Types ─────────────────────────────────────
export interface DerivedMeter {
    meterSN: string;
    siteId: SiteId;
    customerName: string;
    accountNo: string;
    tariffRate: string;
    totalRevenue: number;
    totalKwh: number;
    transactionCount: number;
    firstSeen: string;
    lastSeen: string;
    lastAmount: number;
    status: 'ACTIVE' | 'INACTIVE'; // INACTIVE if no transaction in 60 days
}

export interface DerivedCustomer {
    id: string;               // accountNo or meterSN
    name: string;
    accountNo: string;
    meterSN: string;
    siteId: SiteId;
    tariffId: string;
    status: 'ACTIVE' | 'INACTIVE';
    totalRevenue: number;
    totalKwh: number;
    transactionCount: number;
    firstPurchase: string;
    lastPurchase: string;
    isSynthesized?: boolean;    // Deprecated — data now from real POST endpoints
}

export interface TokenTransaction {
    id: string;
    meterSN: string;
    siteId: SiteId;
    customerName: string;
    accountNo: string;
    amount: number;
    kwh: number;
    tariffRate: string;
    tokenValue: string;
    timestamp: string;
}

export interface MeterConsumption {
    month: string;             // "2025-01", "2025-02", etc.
    totalKwh: number;
    totalRevenue: number;
    transactionCount: number;
}

export interface DailyConsumptionAnalytics {
    date: string; // YYYY-MM-DD
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
    siteId: SiteId;
    dayKwh: number;
    nightKwh: number;
    totalKwh: number;
}

export interface EngineSnapshot {
    meters: DerivedMeter[];
    customers: DerivedCustomer[];
    transactions: TokenTransaction[];
    fetchedAt: string;
    totalRecords: number;
    sitesScanned: SiteId[];
}

// ── Cache ────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedSnapshot: EngineSnapshot | null = null;
let cacheExpiresAt = 0;

// ── Engine ───────────────────────────────────────────────────
class TokenDataEngine {

    /**
     * Fetch ALL real customers from POST /customer/read (paginated).
     * Returns a Map of customerId (= meterId) → customer details.
     */
    private async fetchCustomerRegistry(): Promise<Map<string, { name: string; address: string; stationId: string; certifiNo: string }>> {
        const registry = new Map<string, { name: string; address: string; stationId: string; certifiNo: string }>();
        try {
            const res = await odysseyClient.post<any>('/customer/read', { pageNumber: 1, pageSize: 100000 });
            const customers = res?.result?.data ?? [];

            for (const c of customers) {
                if (c.customerId && c.customerId !== 'N/A' && c.customerId !== '123') {
                    // Normalize 12-digit customerId '47000...' to 11-digit meterId '4700...'
                    const normalizedId = c.customerId.replace(/^47000/, '4700');
                    const data = {
                        name: c.customerName || `Customer ${c.customerId.slice(-4)}`,
                        address: c.address || '',
                        stationId: c.stationId || '',
                        certifiNo: c.certifiNo || '',
                    };
                    registry.set(c.customerId, data);
                    if (normalizedId !== c.customerId) {
                        registry.set(normalizedId, data);
                    }
                }
            }
            logger.info(`[TOKEN ENGINE] Customer registry complete: ${registry.size} keys mapped from ${customers.length} records`);
        } catch (err) {
            logger.warn('[TOKEN ENGINE] Failed to fetch customer registry', { error: (err as Error).message });
        }
        return registry;
    }

    private async fetchMeterRegistry(customerRegistry: Map<string, any>): Promise<Map<string, DerivedMeter>> {
        const meterMap = new Map<string, DerivedMeter>();
        try {
            const res = await odysseyClient.post<any>('/meter/read', { pageNumber: 1, pageSize: 100000 });
            const meters = res?.result?.data ?? [];

            for (const m of meters) {
                const meterSN = String(m.meterId || m.meterSN || m.MeterSN || '');
                if (!meterSN || meterSN === 'N/A') continue;

                const regEntry = customerRegistry.get(meterSN);
                const customerName = regEntry?.name || `Customer ${meterSN.slice(-4)}`;
                const accountNo = regEntry?.certifiNo || `ACCT-${meterSN}`;

                if (!meterMap.has(meterSN)) {
                    meterMap.set(meterSN, {
                        meterSN,
                        siteId: m.stationId || 'UNKNOWN',
                        customerName,
                        accountNo,
                        tariffRate: 'Standard',
                        totalRevenue: 0,
                        totalKwh: 0,
                        transactionCount: 0,
                        firstSeen: 'N/A',
                        lastSeen: 'N/A',
                        lastAmount: 0,
                        status: 'INACTIVE', // Assume inactive unless tokens exist
                    });
                }
            }
            logger.info(`[TOKEN ENGINE] Meter registry complete: ${meterMap.size} meters mapped from ${meters.length} records`);
        } catch (err) {
            logger.warn('[TOKEN ENGINE] Failed to fetch meter registry', { error: (err as Error).message });
        }
        return meterMap;
    }

    /**
     * Fetch ALL real tariffs from POST /tariff/read.
     */
    async fetchTariffs(): Promise<any[]> {
        try {
            const res = await odysseyClient.post<any>('/tariff/read', { pageNumber: 1, pageSize: 100000 });
            return res?.result?.data ?? [];
        } catch (err) {
            logger.warn('[TOKEN ENGINE] Failed to fetch tariffs', { error: (err as Error).message });
            return [];
        }
    }

    /**
     * Fetch ALL gateways from POST /gateway/read.
     */
    async fetchGateways(): Promise<any[]> {
        try {
            const res = await odysseyClient.post<any>('/gateway/read', { pageNumber: 1, pageSize: 100000 });
            return res?.result?.data ?? [];
        } catch (err) {
            logger.warn('[TOKEN ENGINE] Failed to fetch gateways', { error: (err as Error).message });
            return [];
        }
    }

    /**
     * Fetch ALL token records from all 5 sites and build the complete snapshot.
     * Joins real customer names from POST /customer/read.
     * Results are cached for 5 minutes for performance.
     */
    async getSnapshot(forceRefresh = false): Promise<EngineSnapshot> {
        const now = Date.now();
        if (!forceRefresh && cachedSnapshot && now < cacheExpiresAt) {
            return cachedSnapshot;
        }

        logger.info('[TOKEN ENGINE] Building data snapshot from all sites...');
        const startTime = Date.now();

        // Fetch real customer names from POST /customer/read in parallel with token records
        // Fetch real customer names from POST /customer/read
        const customerRegistry = await this.fetchCustomerRegistry();

        // Fetch tokens and ALL meters in parallel to save time
        const [siteResults, baseMeterMap] = await Promise.all([
            (async () => {
                const results = await Promise.allSettled(
                    config.odyssey.sites.map(async (siteId) => {
                        const fromDate = new Date();
                        fromDate.setFullYear(fromDate.getFullYear() - 1);

                        const res = await odysseyClient.get<any>(
                            '/token/creditTokenRecord/readMore',
                            { FROM: fromDate.toISOString(), TO: new Date().toISOString(), pageLimit: 100, SITE_ID: siteId }
                        );
                        // GET readMore returns the array directly or in a standard wrapper handled by extractArray
                        const data = res ?? [];
                        return { siteId, data: Array.isArray(data) ? data : (data.records ?? data.payments ?? []) };
                    })
                );
                return results
                    .filter((r): r is PromiseFulfilledResult<{ siteId: SiteId; data: any[] }> => r.status === 'fulfilled')
                    .map(r => r.value);
            })(),
            this.fetchMeterRegistry(customerRegistry),
        ]);

        // Parse all raw records into typed transactions
        const transactions: TokenTransaction[] = [];
        const meterMap = baseMeterMap;

        for (const site of siteResults) {
            for (const raw of site.data) {
                // CRITICAL: Odyssey API uses 'meterId' field (e.g. '47005309647')
                // 'serialNumber' and 'customerId' are always 'N/A' in token records
                const meterSN = raw.meterId || raw.MeterSN || raw.meterSN || '';
                if (!meterSN || meterSN === 'N/A') continue;

                const amount = raw.totalPaid ?? raw.Amount ?? raw.amount ?? 0;
                const kwh = raw.totalUnit ?? raw.TransactionKwh ?? raw.transactionKwh ?? 0;
                // createDate looks like "2026-02-25 12:43:20" which is valid for new Date()
                let timestamp = raw.createDate ?? raw.Timestamp ?? raw.timestamp ?? raw.CreatedAt ?? '';
                if (timestamp && timestamp.length === 19 && timestamp.includes(' ')) {
                    // Convert "2026-02-25 12:43:20" to "2026-02-25T12:43:20Z" roughly or just valid ISO
                    timestamp = timestamp.replace(' ', 'T') + 'Z';
                }

                // Resolve real customer name from POST /customer/read registry
                // customerId in customer table = meterId in token records
                const registryEntry = customerRegistry.get(meterSN);
                let customerName = raw.customerName || registryEntry?.name || `Customer ${meterSN.slice(-4)}`;
                if (customerName === 'N/A' && registryEntry?.name) {
                    customerName = registryEntry.name;
                }
                const accountNo = registryEntry?.certifiNo || `ACCT-${meterSN}`;
                const tariffRate = raw.tariffId ?? raw.TariffRate ?? raw.tariffRate ?? raw.transactionType ?? 'Standard';
                const tokenValue = raw.token ?? raw.TokenValue ?? raw.tokenValue ?? '';
                const receiptId = raw.receiptId ?? raw.TransactionId ?? raw.transactionId ?? raw.Id;

                const tx: TokenTransaction = {
                    id: receiptId ? `receipt-${receiptId}` : `${meterSN}-${timestamp}`,
                    meterSN,
                    siteId: site.siteId,
                    customerName,
                    accountNo,
                    amount,
                    kwh,
                    tariffRate: String(tariffRate),
                    tokenValue: String(tokenValue),
                    timestamp,
                };
                transactions.push(tx);

                // Build/update meter entry — keyed by unique meterId
                const meterKey = `${meterSN}`;
                const existing = meterMap.get(meterKey);
                if (!existing) {
                    meterMap.set(meterKey, {
                        meterSN,
                        siteId: site.siteId,
                        customerName,
                        accountNo,
                        tariffRate: String(tariffRate),
                        totalRevenue: amount,
                        totalKwh: kwh,
                        transactionCount: 1,
                        firstSeen: timestamp,
                        lastSeen: timestamp,
                        lastAmount: amount,
                        status: 'ACTIVE',
                    });
                } else {
                    existing.totalRevenue += amount;
                    existing.totalKwh += kwh;
                    existing.transactionCount += 1;
                    if (timestamp && (existing.lastSeen === 'N/A' || timestamp > existing.lastSeen)) {
                        existing.lastSeen = timestamp;
                        existing.lastAmount = amount;
                    }
                    if (timestamp && (existing.firstSeen === 'N/A' || timestamp < existing.firstSeen)) {
                        existing.firstSeen = timestamp;
                    }
                    existing.status = 'ACTIVE';
                }
            }
        }

        // Mark inactive meters (no transaction in 60 days)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const cutoff = sixtyDaysAgo.toISOString();
        for (const meter of meterMap.values()) {
            if (meter.lastSeen < cutoff) {
                meter.status = 'INACTIVE';
            }
        }

        const meters = Array.from(meterMap.values());

        // Build customer profiles (deduplicated by accountNo, fallback to meterSN)
        const customerMap = new Map<string, DerivedCustomer>();
        for (const m of meters) {
            const key = m.accountNo !== 'N/A' ? m.accountNo : m.meterSN;
            const existing = customerMap.get(key);
            if (!existing) {
                customerMap.set(key, {
                    id: key,
                    name: m.customerName,
                    accountNo: m.accountNo,
                    meterSN: m.meterSN,
                    siteId: m.siteId,
                    tariffId: m.tariffRate,
                    status: m.status,
                    totalRevenue: m.totalRevenue,
                    totalKwh: m.totalKwh,
                    transactionCount: m.transactionCount,
                    firstPurchase: m.firstSeen,
                    lastPurchase: m.lastSeen,
                    isSynthesized: true,
                });
            } else {
                // Merge (customer has multiple meters)
                existing.totalRevenue += m.totalRevenue;
                existing.totalKwh += m.totalKwh;
                existing.transactionCount += m.transactionCount;
                if (m.lastSeen > existing.lastPurchase) {
                    existing.lastPurchase = m.lastSeen;
                    existing.name = m.customerName;
                }
                if (m.firstSeen < existing.firstPurchase) {
                    existing.firstPurchase = m.firstSeen;
                }
                if (m.status === 'ACTIVE') existing.status = 'ACTIVE';
            }
        }

        const customers = Array.from(customerMap.values());

        // Sort transactions by timestamp descending
        transactions.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const snapshot: EngineSnapshot = {
            meters,
            customers,
            transactions,
            fetchedAt: new Date().toISOString(),
            totalRecords: transactions.length,
            sitesScanned: config.odyssey.sites,
        };

        // Cache
        cachedSnapshot = snapshot;
        cacheExpiresAt = now + CACHE_TTL_MS;

        const elapsed = Date.now() - startTime;
        logger.info(`[TOKEN ENGINE] Snapshot built: ${meters.length} meters, ${customers.length} customers, ${transactions.length} transactions in ${elapsed}ms`);

        return snapshot;
    }

    // ── Query helpers ────────────────────────────────────────

    async getMeters(siteId?: SiteId): Promise<DerivedMeter[]> {
        const snap = await this.getSnapshot();
        if (!siteId) return snap.meters;
        return snap.meters.filter(m => m.siteId === siteId);
    }

    async getMeterDetails(meterSN: string): Promise<{
        meter: DerivedMeter | null;
        transactions: TokenTransaction[];
        consumption: MeterConsumption[];
    }> {
        const snap = await this.getSnapshot();
        const meter = snap.meters.find(m => m.meterSN === meterSN) ?? null;
        const transactions = snap.transactions.filter(t => t.meterSN === meterSN);
        const consumption = this.buildConsumptionTimeline(transactions);
        return { meter, transactions, consumption };
    }

    async getCustomers(siteId?: SiteId, search?: string): Promise<DerivedCustomer[]> {
        const snap = await this.getSnapshot();
        let customers = snap.customers;
        if (siteId) customers = customers.filter(c => c.siteId === siteId);
        if (search) {
            const q = search.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.meterSN.toLowerCase().includes(q) ||
                c.accountNo.toLowerCase().includes(q)
            );
        }
        return customers;
    }

    async getCustomerDetails(customerId: string): Promise<{
        customer: DerivedCustomer | null;
        transactions: TokenTransaction[];
        consumption: MeterConsumption[];
    }> {
        const snap = await this.getSnapshot();
        const customer = snap.customers.find(c => c.id === customerId) ?? null;
        if (!customer) return { customer: null, transactions: [], consumption: [] };
        const transactions = snap.transactions.filter(t =>
            t.meterSN === customer.meterSN || t.accountNo === customer.accountNo
        );
        const consumption = this.buildConsumptionTimeline(transactions);
        return { customer, transactions, consumption };
    }

    async getRecentTransactions(limit = 20): Promise<TokenTransaction[]> {
        const snap = await this.getSnapshot();
        return snap.transactions.slice(0, limit);
    }

    async getSiteStats(): Promise<Record<SiteId, {
        revenue: number;
        kwh: number;
        meterCount: number;
        customerCount: number;
    }>> {
        const snap = await this.getSnapshot();
        const stats: Record<string, any> = {};
        for (const site of config.odyssey.sites) {
            const siteMeters = snap.meters.filter(m => m.siteId === site);
            const siteCustomers = snap.customers.filter(c => c.siteId === site);
            stats[site] = {
                revenue: siteMeters.reduce((s, m) => s + m.totalRevenue, 0),
                kwh: siteMeters.reduce((s, m) => s + m.totalKwh, 0),
                meterCount: siteMeters.length,
                customerCount: siteCustomers.length,
            };
        }
        return stats;
    }

    async getMeterStats(siteId?: SiteId): Promise<{
        totalMeters: number;
        activeMeters: number;
        inactiveMeters: number;
        totalKwh: number;
        dayKwh: number;
        nightKwh: number;
        totalRevenue: number;
    }> {
        const snap = await this.getSnapshot();
        let meters = snap.meters;
        let txs = snap.transactions;
        if (siteId) {
            meters = meters.filter(m => m.siteId === siteId);
            txs = txs.filter(t => t.siteId === siteId);
        }

        // Day/night from actual kWh dispensed per transaction
        let dayKwh = 0, nightKwh = 0;
        for (const tx of txs) {
            if (!tx.timestamp) continue;
            const d = new Date(tx.timestamp);
            if (isNaN(d.getTime())) continue;
            const hour = d.getHours();
            if (hour >= 6 && hour < 18) dayKwh += tx.kwh;
            else nightKwh += tx.kwh;
        }

        return {
            totalMeters: meters.length,
            activeMeters: meters.filter(m => m.status === 'ACTIVE').length,
            inactiveMeters: meters.filter(m => m.status === 'INACTIVE').length,
            totalKwh: meters.reduce((s, m) => s + m.totalKwh, 0),
            dayKwh,
            nightKwh,
            totalRevenue: meters.reduce((s, m) => s + m.totalRevenue, 0),
        };
    }

    async getCustomerStats(siteId?: SiteId): Promise<{
        totalCustomers: number;
        activeCustomers: number;
        inactiveCustomers: number;
        totalRevenue: number;
        totalTransactions: number;
    }> {
        const snap = await this.getSnapshot();
        let customers = snap.customers;
        if (siteId) customers = customers.filter(c => c.siteId === siteId);

        return {
            totalCustomers: customers.length,
            activeCustomers: customers.filter(c => c.status === 'ACTIVE').length,
            inactiveCustomers: customers.filter(c => c.status === 'INACTIVE').length,
            totalRevenue: customers.reduce((s, c) => s + c.totalRevenue, 0),
            totalTransactions: customers.reduce((s, c) => s + c.transactionCount, 0),
        };
    }

    async getNonPurchaseMeters(dayThreshold = 30): Promise<DerivedMeter[]> {
        const snap = await this.getSnapshot();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - dayThreshold);
        const cutoffStr = cutoff.toISOString();
        return snap.meters.filter(m => m.lastSeen < cutoffStr);
    }

    async getLowPurchaseMeters(amountThreshold = 500): Promise<DerivedMeter[]> {
        const snap = await this.getSnapshot();
        return snap.meters.filter(m => m.lastAmount < amountThreshold);
    }

    // ── Analytics ────────────────────────────────────────────

    async getConsumptionAnalytics(filters?: { siteId?: string; meterSN?: string }): Promise<DailyConsumptionAnalytics[]> {
        const snap = await this.getSnapshot();
        let txs = snap.transactions;
        if (filters?.siteId) txs = txs.filter(t => t.siteId === filters.siteId);
        if (filters?.meterSN) txs = txs.filter(t => t.meterSN === filters.meterSN);

        const dailyMap = new Map<string, DailyConsumptionAnalytics>();

        for (const tx of txs) {
            if (!tx.timestamp) continue;
            const dateObj = new Date(tx.timestamp);
            if (isNaN(dateObj.getTime())) continue;

            // Format to YYYY-MM-DD local time
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            const hour = dateObj.getHours();

            // Day: 06:00 to 17:59
            const isDay = hour >= 6 && hour < 18;

            let entry = dailyMap.get(dateKey);
            if (!entry) {
                entry = {
                    date: dateKey,
                    dayKwh: 0, nightKwh: 0,
                    dayRevenue: 0, nightRevenue: 0,
                    dayTransactions: 0, nightTransactions: 0,
                    totalKwh: 0, totalRevenue: 0,
                };
                dailyMap.set(dateKey, entry);
            }

            if (isDay) {
                entry.dayKwh += tx.kwh;
                entry.dayRevenue += tx.amount;
                entry.dayTransactions += 1;
            } else {
                entry.nightKwh += tx.kwh;
                entry.nightRevenue += tx.amount;
                entry.nightTransactions += 1;
            }
            entry.totalKwh += tx.kwh;
            entry.totalRevenue += tx.amount;
        }

        return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    async getMeterConsumptionAnalytics(filters?: { siteId?: string }): Promise<MeterConsumptionAnalytics[]> {
        const snap = await this.getSnapshot();
        let txs = snap.transactions;
        if (filters?.siteId) txs = txs.filter(t => t.siteId === filters.siteId);

        const meterMap = new Map<string, MeterConsumptionAnalytics>();
        for (const tx of txs) {
            if (!tx.timestamp) continue;
            const dateObj = new Date(tx.timestamp);
            if (isNaN(dateObj.getTime())) continue;
            const hour = dateObj.getHours();
            const isDay = hour >= 6 && hour < 18;

            let entry = meterMap.get(tx.meterSN);
            if (!entry) {
                entry = {
                    meterSN: tx.meterSN,
                    customerName: tx.customerName,
                    siteId: tx.siteId,
                    dayKwh: 0, nightKwh: 0, totalKwh: 0
                };
                meterMap.set(tx.meterSN, entry);
            }

            if (isDay) entry.dayKwh += tx.kwh;
            else entry.nightKwh += tx.kwh;

            entry.totalKwh += tx.kwh;
        }

        return Array.from(meterMap.values()).sort((a, b) => b.totalKwh - a.totalKwh);
    }

    // ── Internal helpers ─────────────────────────────────────

    private buildConsumptionTimeline(transactions: TokenTransaction[]): MeterConsumption[] {
        const monthMap = new Map<string, MeterConsumption>();
        for (const tx of transactions) {
            if (!tx.timestamp) continue;
            const date = new Date(tx.timestamp);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const existing = monthMap.get(month);
            if (!existing) {
                monthMap.set(month, {
                    month,
                    totalKwh: tx.kwh,
                    totalRevenue: tx.amount,
                    transactionCount: 1,
                });
            } else {
                existing.totalKwh += tx.kwh;
                existing.totalRevenue += tx.amount;
                existing.transactionCount += 1;
            }
        }
        return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    }
}

// Singleton
export const tokenDataEngine = new TokenDataEngine();
