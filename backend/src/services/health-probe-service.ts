// ============================================================
// /backend/src/services/health-probe-service.ts
// Automated polling of critical Odyssey endpoints to detect
// vendor 404s or schema changes early.
// ============================================================
import cron from 'node-cron';
import { odysseyClient } from './odyssey-client';
import { alertingService } from './alerting-service';
import { logger } from '../config/logger';
import { config } from '../config';

const ENDPOINTS_TO_CHECK = [
    { name: 'Customer_Management', path: '/Management/customer', method: 'GET' },
    { name: 'Token_Records', path: '/token/creditTokenRecord/readMore', method: 'GET' },
    { name: 'Hourly_Data', path: '/DailyDataMeter/readHourly', method: 'GET' },
];

class HealthProbeService {
    private failureCounts: Record<string, number> = {};

    public startCron() {
        // Run every 6 hours
        cron.schedule('0 */6 * * *', () => {
            logger.info('Running automated Odyssey API Health Probe...');
            this.runProbes().catch(err => logger.error('Health Probe Cron Error', err));
        });
        logger.info('API Health Probe CRON job scheduled (every 6 hours).');
    }

    public async runProbes() {
        const siteId = config.odyssey.sites[0]; // Just check against one main site for health
        if (!siteId) return;

        const results = [];

        for (const endpoint of ENDPOINTS_TO_CHECK) {
            try {
                logger.debug(`Health Probe checking ${endpoint.path}`);
                let responseData;

                if (endpoint.method === 'GET') {
                    responseData = await odysseyClient.get<any>(endpoint.path, {
                        SITE_ID: siteId,
                        offset: 0,
                        pageLimit: 1
                    });
                } else {
                    responseData = await odysseyClient.post<any>(endpoint.path, {
                        SITE_ID: siteId,
                        offset: 0,
                        pageLimit: 1
                    });
                }

                // Reset failure count on success
                this.failureCounts[endpoint.path] = 0;

                results.push({
                    endpoint: endpoint.path,
                    status: 'OK',
                    schema: this.getTopLevelSchema(responseData)
                });

            } catch (err: any) {
                const status = err.response?.status || 'Network Error';
                this.failureCounts[endpoint.path] = (this.failureCounts[endpoint.path] || 0) + 1;

                results.push({
                    endpoint: endpoint.path,
                    status: 'ERROR',
                    statusCode: status,
                    message: err.message
                });

                // Escalate if 3 or more consecutive failures
                if (this.failureCounts[endpoint.path] >= 3) {
                    await alertingService.escalateVendorIssue({
                        endpoint: endpoint.path,
                        level: 'CRITICAL',
                        message: `Endpoint failing continuously: ${status}. Frontend features relying on this may break without fallback.`,
                        consecutiveFailures: this.failureCounts[endpoint.path],
                        lastError: err.message
                    });
                }
            }
        }

        return results;
    }

    private getTopLevelSchema(data: any): string[] {
        if (!data) return [];
        if (Array.isArray(data)) {
            return data.length > 0 ? Object.keys(data[0]) : [];
        }
        if (data.data && Array.isArray(data.data)) {
            return data.data.length > 0 ? Object.keys(data.data[0]) : ['data'];
        }
        if (data.Data && Array.isArray(data.Data)) {
            return data.Data.length > 0 ? Object.keys(data.Data[0]) : ['Data'];
        }
        return Object.keys(data);
    }
}

export const healthProbeService = new HealthProbeService();
