// ============================================================
// /backend/src/services/alerting-service.ts
// Handles API health monitoring escalation and alerts
// ============================================================
import { logger } from '../config/logger';

export interface AlertPayload {
    endpoint: string;
    level: 'WARNING' | 'CRITICAL';
    message: string;
    consecutiveFailures: number;
    lastError?: any;
    meta?: any;
}

class AlertingService {
    public async escalateVendorIssue(payload: AlertPayload): Promise<void> {
        logger.error(`[VENDOR ESCALATION] API Failure at ${payload.endpoint} - ${payload.message}`, {
            escalation: true,
            level: payload.level,
            failures: payload.consecutiveFailures,
            lastError: payload.lastError,
            meta: payload.meta,
        });

        // In a production system, this could trigger an email, SMS (Twilio), or Slack/Teams webhook
        // For now, logging to the dedicated vendor-escalation transport in logger.ts is sufficient to capture it.
    }
}

export const alertingService = new AlertingService();
