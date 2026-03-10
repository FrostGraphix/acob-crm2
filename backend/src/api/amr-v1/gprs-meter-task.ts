// ============================================================
// /backend/src/api/amr-v1/gprs-meter-task.ts
// AMR API V1 — GPRS/Remote meter tasks functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { AmrResponse } from '../../../../common/types/odyssey';

export const gprsMeterTaskRouter = Router();

/**
 * POST /api/GPRSMeterTask/GPRSCreateReadingTask
 */
gprsMeterTaskRouter.post('/GPRSCreateReadingTask', async (req: Request, res: Response) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        const results = items.map((item: any) => ({
            ...item,
            id: Math.floor(Math.random() * 1000000),
            status: 0,
            createDate: new Date().toISOString(),
        }));
        res.json({ code: 0, reason: 'Success', result: results });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/GPRSMeterTask/GPRSCreateControlTask
 */
gprsMeterTaskRouter.post('/GPRSCreateControlTask', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: true });
});

/**
 * POST /api/GPRSMeterTask/GPRSGetReadingTask
 */
gprsMeterTaskRouter.post('/GPRSGetReadingTask', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: { total: 0, data: [] } });
});
