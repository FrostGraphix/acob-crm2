// ============================================================
// /backend/src/api/diagnostics.ts
// Exposes Odyssey probe scripts to the Admin UI
// ============================================================
import { Router } from 'express';
import { logger } from '../config/logger';
import { healthProbeService } from '../services/health-probe-service';

export const diagnosticsRouter = Router();

// Run health probe on-demand from the UI
diagnosticsRouter.get('/run-probe', async (req, res) => {
    logger.info('Manual diagnostic probe requested from UI');
    try {
        const results = await healthProbeService.runProbes();
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: results
        });
    } catch (err: any) {
        logger.error('Manual diagnostic probe failed', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
