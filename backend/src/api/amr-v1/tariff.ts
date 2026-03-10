// ============================================================
// /backend/src/api/amr-v1/tariff.ts
// AMR API V1 — Tariff functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { listTariffs } from '../../services/management-service';

export const tariffRouter = Router();

/**
 * POST /api/tariff/read
 */
tariffRouter.post('/read', async (req: Request, res: Response) => {
    try {
        const data = await listTariffs(undefined);
        res.json({
            code: 0,
            reason: 'Success',
            result: {
                total: data.length,
                data: data.map(t => ({
                    tariffId: t.id,
                    tariffName: t.name,
                    price: t.ratePerKwh.toString(),
                    stationId: t.siteId,
                    tax: 0,
                    createDate: new Date().toISOString(),
                }))
            }
        });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});
