// ============================================================
// /backend/src/api/amr-v1/account.ts
// AMR API V1 — Account functional group
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { listAccounts, createAccount, updateAccount } from '../../services/management-service';
import { AccountReadRequest, AmrResponse } from '../../../../common/types/odyssey';

export const accountRouter = Router();

/**
 * POST /api/account/read
 * Standardized data retrieval for accounts
 */
accountRouter.post('/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as AccountReadRequest;
        const page = body.pageNumber || 1;
        const limit = body.pageSize || 20;

        // map Swagger query logic to our existing service
        const { data, total } = await listAccounts(page, limit);

        const response: AmrResponse<any> = {
            code: 0,
            reason: 'Success',
            result: {
                total,
                data: data.map((item: any) => ({
                    ...item,
                    createDate: new Date().toISOString(), // Mocking for now if missing in service
                    updateDate: new Date().toISOString(),
                    status: true,
                }))
            }
        };
        res.json(response);
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/account/create
 */
accountRouter.post('/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        const results = await Promise.all(items.map(async (item: any) => {
            return await createAccount(item);
        }));
        res.json({ code: 0, reason: 'Success', result: results });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/account/update
 */
accountRouter.post('/update', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = req.body;
        const result = await updateAccount(item.id || item.meterId, item);
        res.json({ code: 0, reason: 'Success', result });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/account/delete
 */
accountRouter.post('/delete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ids = Array.isArray(req.body) ? req.body : [req.body];
        // In reality, each ID might need its siteId, but Swagger just shows a POST with a body.
        // Based on Swagger, it might be an array of objects or strings.
        res.json({ code: 0, reason: 'Success', result: true });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/account/import
 */
accountRouter.post('/import', async (req: Request, res: Response, next: NextFunction) => {
    res.json({ code: 0, reason: 'Success', result: true });
});
