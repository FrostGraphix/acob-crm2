// ============================================================
// /backend/src/services/analysis-engine.ts
// Background worker that scans the TokenDataEngine snapshot
// and generates real-time notifications for anomalies.
// ============================================================
import cron from 'node-cron';
import { tokenDataEngine } from './token-data-engine';
import { notificationService } from './notification-service';
import { logger } from '../config/logger';

// Prevent duplicate notifications being fired every 15 mins for the same problem
const notifiedMeters = new Set<string>();

// Thresholds
const LOW_BALANCE_THRESHOLD_NGN = 1000;
const LOW_BALANCE_THRESHOLD_KWH = 5;
const OFFLINE_THRESHOLD_DAYS = 30;

class AnalysisEngine {
    public startCron() {
        // Run every 15 minutes
        cron.schedule('*/15 * * * *', () => {
            logger.info('Running Analysis Engine to check for meter anomalies...');
            this.runAnalysis().catch(err => logger.error('Analysis Engine Error', err));
        });
        logger.info('Analysis Engine CRON job scheduled (every 15 minutes).');

        // Run once immediately on startup logic could go here if wanted,
        // but the token engine snapshot might not be ready. We'll wait for the first cron tick or call manually.
    }

    public async runAnalysis() {
        // 1. Get the latest snapshot containing all meters across all sites
        const snapshot = await tokenDataEngine.getSnapshot();
        const meters = snapshot.meters;

        if (!meters || meters.length === 0) {
            logger.warn('Analysis Engine: No meters found in TokenDataEngine snapshot.');
            return;
        }

        let alertsGenerated = 0;

        // 2. Scan each meter against our rules
        for (const meter of meters) {
            // Rule A: Tamper / Inactive Alert (> 30 days since last purchase)
            if (meter.status === 'INACTIVE') {
                // Double check against exact cutoff if needed, but 'INACTIVE' already implies offline for 60 days in TokenEngine.
                // Let's rely on TokenEngine's own getNonPurchaseMeters helper for more precise thresholds.
            }
        }

        // A better approach using TokenDataEngine's built-in query helpers:

        try {
            // -- OFFLINE / TAMPER METERS --
            const offlineMeters = await tokenDataEngine.getNonPurchaseMeters(OFFLINE_THRESHOLD_DAYS);
            for (const meter of offlineMeters) {
                const alertKey = `offline_${meter.meterSN}`;
                if (!notifiedMeters.has(alertKey)) {
                    await notificationService.createNotification({
                        title: 'Meter Inactive / Offline',
                        message: `Meter ${meter.meterSN} at ${meter.siteId} hasn't purchased tokens in over ${OFFLINE_THRESHOLD_DAYS} days. Possible bypass.`,
                        type: 'alert',
                        userId: '0001'
                    });
                    notifiedMeters.add(alertKey);
                    alertsGenerated++;
                }
            }

            // -- LOW BALANCE METERS --
            // We'll use the lastAmount as a simple proxy for low balance since the API doesn't return live remaining balance directly.
            const lowBalanceMeters = await tokenDataEngine.getLowPurchaseMeters(LOW_BALANCE_THRESHOLD_NGN);
            for (const meter of lowBalanceMeters) {
                const alertKey = `low_bal_${meter.meterSN}_${meter.lastSeen}`; // reset alert if they purchase again
                if (!notifiedMeters.has(alertKey)) {
                    await notificationService.createNotification({
                        title: 'Low Purchase Alert',
                        message: `Meter ${meter.meterSN} at ${meter.siteId} recently purchased only NGN ${meter.lastAmount}.`,
                        type: 'warning',
                        userId: '0001',
                        link: `/management?site=${meter.siteId}&search=${meter.meterSN}` // Optional deep link
                    });
                    notifiedMeters.add(alertKey);
                    alertsGenerated++;

                    // Cleanup old keys for this meter to prevent memory leak
                    for (const key of notifiedMeters) {
                        if (key.startsWith(`low_bal_${meter.meterSN}_`) && key !== alertKey) {
                            notifiedMeters.delete(key);
                        }
                    }
                }
            }

            // -- LARGE PURCHASES (SUCCESS) --
            const largePurchases = meters.filter(m => m.lastAmount > 50000);
            for (const meter of largePurchases) {
                const alertKey = `large_pur_${meter.meterSN}_${meter.lastSeen}`;
                if (!notifiedMeters.has(alertKey)) {
                    await notificationService.createNotification({
                        title: 'Large Vending Transaction',
                        message: `${meter.customerName} (${meter.siteId}) purchased NGN ${meter.lastAmount.toLocaleString()} recently.`,
                        type: 'success',
                        userId: '0001'
                    });
                    notifiedMeters.add(alertKey);
                    alertsGenerated++;
                }
            }

            logger.info(`Analysis Engine complete. Generated ${alertsGenerated} new alerts.`);

        } catch (error) {
            logger.error('Error analyzing meter data for notifications:', error);
        }
    }
}

export const analysisEngine = new AnalysisEngine();

