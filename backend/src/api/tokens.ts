// ============================================================
// /backend/src/api/tokens.ts
// Token generation and record retrieval routes
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  generateCreditToken,
  getCreditTokenRecords,
  generateClearTamperToken,
  generateClearCreditToken,
  generateMaxPowerToken,
  getClearTamperTokenRecords,
  getClearCreditTokenRecords,
  getSetMaxPowerTokenRecords,
} from '../services/token-service';
import { SITES, SiteId } from '../../../common/types/odyssey';
import { devAuthMiddleware } from '../middleware/auth';

export const tokensRouter = Router();

const SiteIdSchema = z.enum(SITES);

// ── POST /api/tokens/credit — generate credit token
tokensRouter.post('/credit', devAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      meterSN: z.string().min(1, 'meterSN is required'),
      amount: z.number().positive('amount must be positive'),
      tariffRate: z.number().positive('tariffRate must be positive'),
      siteId: SiteIdSchema,
      operatorId: z.string().min(1, 'operatorId is required'),
    });

    const body = schema.parse(req.body);
    const result = await generateCreditToken(body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

// ── POST /api/tokens/clear-tamper
tokensRouter.post('/clear-tamper', devAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterSN, siteId, operatorId } = z.object({
      meterSN: z.string().min(1),
      siteId: SiteIdSchema,
      operatorId: z.string().min(1),
    }).parse(req.body);

    const result = await generateClearTamperToken(meterSN, siteId, operatorId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// ── POST /api/tokens/clear-credit
tokensRouter.post('/clear-credit', devAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterSN, siteId, operatorId } = z.object({
      meterSN: z.string().min(1),
      siteId: SiteIdSchema,
      operatorId: z.string().min(1),
    }).parse(req.body);

    const result = await generateClearCreditToken(meterSN, siteId, operatorId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// ── POST /api/tokens/max-power
tokensRouter.post('/max-power', devAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterSN, siteId, limitKw, operatorId } = z.object({
      meterSN: z.string().min(1),
      siteId: SiteIdSchema,
      limitKw: z.number().positive(),
      operatorId: z.string().min(1),
    }).parse(req.body);

    const result = await generateMaxPowerToken(meterSN, siteId, limitKw, operatorId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// ── GET /api/tokens/records?siteId=ALL&from=...&to=...
tokensRouter.get('/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId = 'ALL', from, to } = req.query as Record<string, string>;

    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to query params required' });
    }

    const validSiteId = siteId === 'ALL'
      ? 'ALL'
      : SiteIdSchema.parse(siteId);

    const data = await getCreditTokenRecords(validSiteId as SiteId | 'ALL', from, to);
    res.json({ success: true, data, total: data.length });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// ── GET /api/tokens/records/clear-tamper
tokensRouter.get('/records/clear-tamper', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, from, to } = req.query as Record<string, string>;
    if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
    const data = await getClearTamperTokenRecords(SiteIdSchema.parse(siteId), from, to);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/tokens/records/clear-credit
tokensRouter.get('/records/clear-credit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, from, to } = req.query as Record<string, string>;
    if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
    const data = await getClearCreditTokenRecords(SiteIdSchema.parse(siteId), from, to);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/tokens/records/max-power
tokensRouter.get('/records/max-power', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, from, to } = req.query as Record<string, string>;
    if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
    const data = await getSetMaxPowerTokenRecords(SiteIdSchema.parse(siteId), from, to);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
