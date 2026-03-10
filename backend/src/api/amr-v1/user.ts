// ============================================================
// /backend/src/api/amr-v1/user.ts
// AMR API V1 — User/Auth functional group
// ============================================================
import { Router, Request, Response } from 'express';

export const userRouter = Router();

/**
 * POST /api/user/info
 */
userRouter.post('/info', async (req: Request, res: Response) => {
    res.json({
        code: 0,
        reason: 'Success',
        result: {
            userName: 'OdysseyAdmin',
            roleName: 'Lead Architect',
            staffNo: 'ACOB-001',
            mobile: '+2348000000000',
        }
    });
});

/**
 * POST /api/user/read
 */
userRouter.post('/read', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: { total: 0, data: [] } });
});
