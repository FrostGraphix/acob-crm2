// ============================================================
// /backend/src/api/amr-v1/token.ts
// AMR API V1 - Token/STS functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { tokenDataEngine } from '../../services/token-data-engine';
import { generateCreditToken } from '../../services/token-service';
import { TokenCreditTokenRecordReadRequest, AmrResponse, SITES, SiteId } from '../../../../common/types/odyssey';

export const tokenRouter = Router();

/**
 * POST /api/token/creditToken/generate
 */
tokenRouter.post('/creditToken/generate', async (req: Request, res: Response) => {
  try {
    const meterId = String(req.body?.meterId ?? req.body?.meterSN ?? '').trim();
    const amount = Number(req.body?.amount ?? req.body?.totalPaid);
    const rawSiteId = String(req.body?.stationId ?? req.body?.siteId ?? req.body?.SITE_ID ?? '').trim().toUpperCase();
    const siteId = SITES.includes(rawSiteId as SiteId) ? (rawSiteId as SiteId) : null;
    const tariffRate = Number(req.body?.tariffRate ?? req.body?.ratePerKwh ?? 1);
    const operatorId = String(req.body?.operatorId ?? req.body?.createId ?? req.body?.OperatorId ?? 'system').trim() || 'system';

    if (!meterId || !Number.isFinite(amount) || amount <= 0 || !siteId) {
      return res.json({ code: 1, reason: 'meterId, amount, and valid stationId are required.', result: null });
    }

    const generated = await generateCreditToken({
      meterSN: meterId,
      amount,
      tariffRate: Number.isFinite(tariffRate) && tariffRate > 0 ? tariffRate : 1,
      siteId,
      operatorId,
    });

    const result = {
      createId: operatorId,
      createDate: generated.generatedAt,
      receiptId: Date.now(),
      meterId,
      totalPaid: amount,
      totalUnit: generated.energyUnits,
      token: generated.tokenValue,
      stationId: siteId,
    };

    res.json({ code: 0, reason: 'Success', result });
  } catch (err: any) {
    res.json({ code: 1, reason: err.message, result: null });
  }
});

/**
 * POST /api/token/creditTokenRecord/read
 */
tokenRouter.post('/creditTokenRecord/read', async (req: Request, res: Response) => {
  try {
    const body = req.body as TokenCreditTokenRecordReadRequest;
    const snap = await tokenDataEngine.getSnapshot();
    let records = [...snap.transactions];

    if (body.meterId) {
      const meter = body.meterId.toLowerCase();
      records = records.filter(r => r.meterSN.toLowerCase() === meter);
    }

    if (body.stationId) {
      const station = body.stationId.toUpperCase();
      records = records.filter(r => r.siteId.toUpperCase() === station);
    }

    if (body.customerId) {
      const customerId = body.customerId.toLowerCase();
      records = records.filter(r => (r.accountNo ?? '').toLowerCase().includes(customerId));
    }

    if (body.customerName) {
      const customerName = body.customerName.toLowerCase();
      records = records.filter(r => (r.customerName ?? '').toLowerCase().includes(customerName));
    }

    if (body.searchTerm) {
      const search = body.searchTerm.toLowerCase();
      records = records.filter(r =>
        r.meterSN.toLowerCase().includes(search) ||
        (r.customerName ?? '').toLowerCase().includes(search) ||
        (r.accountNo ?? '').toLowerCase().includes(search)
      );
    }

    if (Array.isArray(body.createDateRange) && body.createDateRange.length === 2) {
      const from = new Date(body.createDateRange[0]);
      const to = new Date(body.createDateRange[1]);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        records = records.filter(r => {
          const ts = new Date(r.timestamp);
          return !isNaN(ts.getTime()) && ts >= from && ts <= to;
        });
      }
    }

    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const pageNumber = Math.max(1, Number(body.pageNumber) || 1);
    const pageSize = Math.min(5000, Math.max(1, Number(body.pageSize) || 20));
    const start = (pageNumber - 1) * pageSize;
    const page = records.slice(start, start + pageSize);

    const mapped = page.map(r => ({
      receiptId: r.id,
      customerId: r.accountNo || r.meterSN,
      customerName: r.customerName || 'N/A',
      meterId: r.meterSN,
      meterType: 'GPRS',
      tariffId: r.tariffRate || 'Standard',
      vatCharge: 0,
      totalUnit: r.kwh,
      totalPaid: r.amount,
      token: r.tokenValue,
      vend: 'Direct',
      time: r.timestamp,
      remark: '',
      stationId: r.siteId,
    }));

    const response: AmrResponse<any> = {
      code: 0,
      reason: 'Success',
      result: {
        total: records.length,
        data: mapped,
      },
    };

    res.json(response);
  } catch (err: any) {
    res.json({ code: 1, reason: err.message, result: null });
  }
});

/**
 * POST /api/token/clearTamperToken/generate
 */
tokenRouter.post('/clearTamperToken/generate', async (_req: Request, res: Response) => {
  res.json({ code: 0, reason: 'Success', result: { token: '9876-5432-1098-7654-3210' } });
});

/**
 * POST /api/token/clearTamperTokenRecord/read
 */
tokenRouter.post('/clearTamperTokenRecord/read', async (_req: Request, res: Response) => {
  res.json({ code: 0, reason: 'Success', result: { total: 0, data: [] } });
});
