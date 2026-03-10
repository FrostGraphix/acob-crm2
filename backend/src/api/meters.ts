// ============================================================
// /backend/src/api/meters.ts
// Meter endpoints — powered by Token Data Engine
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { tokenDataEngine } from '../services/token-data-engine';
import type { SiteId } from '../../../common/types/odyssey';

export const metersRouter = Router();

// GET /api/meters?siteId=KYAKALE
metersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId } = req.query as { siteId?: string };
        const meters = await tokenDataEngine.getMeters(siteId as SiteId | undefined);
        res.json({
            success: true,
            data: meters,
            total: meters.length,
            source: 'token-data-engine',
        });
    } catch (err) { next(err); }
});

// GET /api/meters/:meterSN
metersRouter.get('/:meterSN', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { meter, transactions, consumption } = await tokenDataEngine.getMeterDetails(req.params.meterSN);
        if (!meter) {
            return res.status(404).json({ success: false, error: 'Meter not found' });
        }
        res.json({
            success: true,
            data: {
                meter,
                recentTransactions: transactions.slice(0, 50),
                consumption,
                totalTransactions: transactions.length,
            },
        });
    } catch (err) { next(err); }
});

// GET /api/meters/:meterSN/consumption
metersRouter.get('/:meterSN/consumption', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { consumption } = await tokenDataEngine.getMeterDetails(req.params.meterSN);
        res.json({ success: true, data: consumption });
    } catch (err) { next(err); }
});

// GET /api/meters/stats/sites — Site-level aggregate stats
metersRouter.get('/stats/sites', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await tokenDataEngine.getSiteStats();
        res.json({ success: true, data: stats });
    } catch (err) { next(err); }
});

// GET /api/meters/reports/non-purchase?days=30
metersRouter.get('/reports/non-purchase', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const meters = await tokenDataEngine.getNonPurchaseMeters(days);
        res.json({ success: true, data: meters, total: meters.length });
    } catch (err) { next(err); }
});

// GET /api/meters/reports/low-purchase?threshold=500
metersRouter.get('/reports/low-purchase', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const threshold = parseInt(req.query.threshold as string) || 500;
        const meters = await tokenDataEngine.getLowPurchaseMeters(threshold);
        res.json({ success: true, data: meters, total: meters.length });
    } catch (err) { next(err); }
});
