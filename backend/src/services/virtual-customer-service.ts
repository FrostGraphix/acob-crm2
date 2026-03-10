
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import { config } from '../config';
import type { SiteId } from '../../../common/types/odyssey';

export interface VirtualCustomer {
    id: string;      // MeterSN
    name: string;
    accountNumber: string;
    meterSN: string;
    siteId: SiteId;
    status: 'ACTIVE';
    tariffId: string;
    createdAt: string;
}

/**
 * Derives a customer list by scanning token transactions.
 * Essential because /Management/customer is currently returning 404.
 */
export async function listVirtualCustomers(siteId?: SiteId): Promise<VirtualCustomer[]> {
    const sites = siteId ? [siteId] : config.odyssey.sites;
    const from = '2024-01-01T00:00:00.000Z'; // Wide enough to catch active users
    const to = new Date().toISOString();

    logger.info('Scanning for virtual customers', { sites });

    const allTokens = await odysseyClient.fetchAllSites<any>(
        '/token/creditTokenRecord/readMore',
        { FROM: from, TO: to },
        'GET',
        5 // Scan first 500 records per site for performance
    );

    const customerMap = new Map<string, VirtualCustomer>();

    for (const siteResult of allTokens) {
        for (const t of siteResult.data) {
            if (!t.MeterSN) continue;

            // We use MeterSN as the unique ID for now as it's the anchor for tokens/kwh
            if (!customerMap.has(t.MeterSN)) {
                customerMap.set(t.MeterSN, {
                    id: t.MeterSN,
                    name: t.CustomerName || `User ${t.MeterSN}`,
                    accountNumber: t.AccountNo || 'N/A',
                    meterSN: t.MeterSN,
                    siteId: siteResult.siteId as SiteId,
                    status: 'ACTIVE',
                    tariffId: t.TariffRate || 'Unknown',
                    createdAt: t.CreatedAt || to,
                });
            }
        }
    }

    return Array.from(customerMap.values());
}
