// ============================================================
// /backend/src/api/amr-v1/gateway.ts
// AMR API V1 — Gateway functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { listGateways } from '../../services/management-service';

export const gatewayRouter = Router();

/**
 * POST /api/gateway/read
 */
gatewayRouter.post('/read', async (req: Request, res: Response) => {
    try {
        const data = await listGateways(undefined);
        res.json({
            code: 0,
            reason: 'Success',
            result: {
                total: data.length,
                data: data.map((g: any) => ({
                    gatewayId: g.id,
                    gatewayName: g.name,
                    successRate: 100,
                    stationId: g.siteId,
                    status: true,
                    createDate: new Date().toISOString(),
                }))
            }
        });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});
