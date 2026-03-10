
import { logger } from '../config/logger';
import { tokenDataEngine } from './token-data-engine';
import type { SiteId } from '../../../common/types/odyssey';

export interface CustomerFullDetails {
    customer: any;
    purchaseHistory: any[];
    energyUsage: any[];
    stats: {
        totalSpent: number;
        rechargeCount: number;
        totalKwh: number;
        lastRechargeDate?: string;
    };
}

/**
 * Aggregates customer info from the Token Data Engine (cached, fast).
 * No more slow API calls to getHourlyData which times out.
 */
export async function getCustomerFullDetails(
    customerId: string,
    siteId: SiteId
): Promise<CustomerFullDetails> {
    logger.info('Fetching customer details from Token Engine', { customerId, siteId });

    const snapshot = await tokenDataEngine.getSnapshot();

    // Find the meter entry for this customer (try id, meterSN, or accountNo)
    const meter = snapshot.meters.find(m =>
        m.meterSN === customerId ||
        m.accountNo === customerId ||
        `ACCT-${m.meterSN}` === customerId
    );

    // Determine the actual meterSN for transaction lookup
    const meterSN = meter?.meterSN || customerId.replace(/^ACCT-/, '');

    // Get all transactions for this meter
    const customerTokens = snapshot.transactions
        .filter(t => t.meterSN === meterSN || t.meterSN === customerId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Build customer info
    const customer = {
        id: customerId,
        name: meter?.customerName || `Customer ${customerId.slice(-4)}`,
        accountNumber: meter?.accountNo || `ACCT-${customerId}`,
        meterSN: customerId,
        siteId: meter?.siteId || siteId,
        status: meter?.status || 'ACTIVE',
        tariffId: meter?.tariffRate || 'Standard',
        createdAt: meter?.firstSeen || '',
    };

    // Calculate stats from cached data
    const totalSpent = meter?.totalRevenue ?? customerTokens.reduce((s, t) => s + t.amount, 0);
    const totalKwh = meter?.totalKwh ?? customerTokens.reduce((s, t) => s + t.kwh, 0);
    const lastRechargeDate = customerTokens[0]?.timestamp;

    return {
        customer,
        purchaseHistory: customerTokens.map(t => ({
            CreatedAt: t.timestamp,
            Amount: t.amount,
            Token: t.tokenValue,
            Kwh: t.kwh,
            MeterSN: t.meterSN,
        })),
        energyUsage: [],
        stats: {
            totalSpent,
            rechargeCount: customerTokens.length,
            totalKwh,
            lastRechargeDate,
        },
    };
}
