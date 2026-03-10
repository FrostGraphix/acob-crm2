// ============================================================
// /backend/src/services/fallback-synthesizer.ts
// Centralized layer providing synthesized optimal data when
// Odyssey API primary endpoints (like /Management/customer) fail.
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import { config } from '../config';
import type { SiteId } from '../../../common/types/odyssey';

export class FallbackSynthesizer {
    /**
     * Synthesizes a list of customers directly from the Credit Token Record history
     * This ensures the UI never breaks even if the Odyssey customer API is a 404.
     */
    public async synthesizeCustomerList(siteId: SiteId) {
        logger.warn(`[FALLBACK SYNTHESIZER] Generating customer list for site ${siteId} from Token History.`);

        // Grab token history to synthesize customers
        // Fallback uses last 60 days to ensure performance is maintained
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 60);

        try {
            const tokens = await odysseyClient.getCreditTokenRecords(siteId, fromDate.toISOString(), new Date().toISOString());

            // Deduplicate meters to form pseudo-customers
            const customerMap = new Map<string, any>();

            for (const token of tokens) {
                const meterSN = token.MeterSN || token.meterSN;
                if (!meterSN) continue;

                if (!customerMap.has(meterSN)) {
                    customerMap.set(meterSN, {
                        id: meterSN,
                        meterSN: meterSN,
                        name: token.CustomerName || token.customerName || `User ${meterSN}`,
                        accountNumber: token.AccountNo || token.accountNo || 'N/A',
                        siteId: siteId,
                        tariffId: token.TariffRate || token.tariffRate || 'Unknown',
                        status: 'ACTIVE_FALLBACK', // Indicator to frontend
                        isFallback: true
                    });
                }
            }

            return Array.from(customerMap.values());
        } catch (err) {
            logger.error('[FALLBACK SYNTHESIZER] Failed to synthesize customers', err);
            return []; // Return empty array to prevent 500 error cascade to UI
        }
    }
}

export const fallbackSynthesizer = new FallbackSynthesizer();
