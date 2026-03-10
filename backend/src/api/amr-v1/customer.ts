// ============================================================
// /backend/src/api/amr-v1/customer.ts
// AMR API V1 — Customer functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { listCustomers, createCustomer, updateCustomer } from '../../services/management-service';
import { CustomerReadRequest, AmrResponse } from '../../../../common/types/odyssey';

export const customerRouter = Router();

/**
 * POST /api/customer/read
 */
customerRouter.post('/read', async (req: Request, res: Response) => {
    try {
        const body = req.body as CustomerReadRequest;
        const page = body.pageNumber || 1;
        const limit = body.pageSize || 20;
        const search = body.searchTerm || undefined;

        const { data, total } = await listCustomers(page, limit, search);

        const response: AmrResponse<any> = {
            code: 0,
            reason: 'Success',
            result: {
                total,
                data: data.map(item => ({
                    ...item,
                    customerId: item.id || item.customerId,
                    customerName: item.name || item.customerName,
                    phone: item.phone || '',
                    address: item.address || '',
                    certifiName: item.identityType || item.certifiName || '',
                    certifiNo: item.identityNumber || item.certifiNo || '',
                    type: item.type || 0,
                    createDate: item.createDate || new Date().toISOString(),
                    updateDate: item.updateDate || new Date().toISOString(),
                    remark: item.meterSN ? `Meter SN: ${item.meterSN}` : item.remark || '',
                }))
            }
        };
        res.json(response);
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/customer/create
 */
customerRouter.post('/create', async (req: Request, res: Response) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        const results = await Promise.all(items.map(async (item: any) => {
            return await createCustomer(item);
        }));
        res.json({ code: 0, reason: 'Success', result: results });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/customer/update
 */
customerRouter.post('/update', async (req: Request, res: Response) => {
    try {
        const item = req.body;
        const result = await updateCustomer(item.id || item.customerId, item);
        res.json({ code: 0, reason: 'Success', result });
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * POST /api/customer/delete
 */
customerRouter.post('/delete', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: true });
});

/**
 * POST /api/customer/import
 */
customerRouter.post('/import', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: true });
});
