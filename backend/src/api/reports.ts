// ============================================================
// /backend/src/api/reports.ts
// Data Reports REST routes — prepay, AMR, curves, yield, events
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SITES, SiteId } from '../../../common/types/odyssey';
import {
  getLongNonPurchaseReport, getLowPurchaseReport, getConsumptionStatistics,
  getDailyData, getDailyDataByMeter, getMonthlyData,
  getEnergyCurveSingle, getEnergyCurveThreePhase, getEnergyCurveCT,
  getDailyYield, getMonthlyYield,
  getEventNotifications, getInstantaneousValues, toCSV,
} from '../services/report-service';

export const reportsRouter = Router();

const SiteIdSchema = z.enum([...SITES, 'ALL'] as [string, ...string[]]);

function siteParam(req: Request): SiteId | 'ALL' {
  const { siteId = 'ALL' } = req.query as { siteId?: string };
  return (SITES.includes(siteId as any) ? siteId : 'ALL') as SiteId | 'ALL';
}

function dateParams(req: Request) {
  const { from, to } = req.query as { from?: string; to?: string };
  return { from, to };
}

function sendReport(res: Response, data: any[], format: string, filename: string) {
  if (format === 'csv') {
    const flat = data.flatMap((d: any) =>
      Array.isArray(d.data) ? d.data.map((r: any) => ({ siteId: d.siteId, ...r })) : [d]
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(toCSV(flat));
  }
  res.json({ success: true, data, total: data.reduce((s: number, d: any) => s + (d.data?.length ?? 0), 0) });
}

// ── Long Non-Purchase ─────────────────────────────────────────
reportsRouter.get('/non-purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dayThreshold = '30', format = 'json' } = req.query as Record<string, string>;
    const data = await getLongNonPurchaseReport(siteParam(req), parseInt(dayThreshold));
    sendReport(res, data, format, 'non-purchase-report');
  } catch (err) { next(err); }
});

// ── Low Purchase ──────────────────────────────────────────────
reportsRouter.get('/low-purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountThreshold = '500', format = 'json' } = req.query as Record<string, string>;
    const data = await getLowPurchaseReport(siteParam(req), parseFloat(amountThreshold));
    sendReport(res, data, format, 'low-purchase-report');
  } catch (err) { next(err); }
});

// ── Consumption Statistics ────────────────────────────────────
reportsRouter.get('/consumption', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getConsumptionStatistics(siteParam(req), from, to);
    sendReport(res, data, format, 'consumption-statistics');
  } catch (err) { next(err); }
});

// ── Daily AMR Data ────────────────────────────────────────────
reportsRouter.get('/daily-amr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getDailyData(siteParam(req), from, to);
    sendReport(res, data, format, 'daily-amr');
  } catch (err) { next(err); }
});

// ── Daily AMR by Meter ────────────────────────────────────────
reportsRouter.get('/daily-amr/meter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterSN, siteId, from, to } = req.query as Record<string, string>;
    if (!meterSN || !siteId || !from || !to) {
      return res.status(400).json({ success: false, error: 'meterSN, siteId, from, to required' });
    }
    if (!SITES.includes(siteId as any)) {
      return res.status(400).json({ success: false, error: `Invalid siteId. Must be one of: ${SITES.join(', ')}` });
    }
    const data = await getDailyDataByMeter(meterSN, siteId as SiteId, from, to);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

// ── Monthly AMR Data ──────────────────────────────────────────
reportsRouter.get('/monthly-amr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getMonthlyData(siteParam(req), from, to);
    sendReport(res, data, format, 'monthly-amr');
  } catch (err) { next(err); }
});

// ── Energy Curves ─────────────────────────────────────────────
reportsRouter.get('/energy-curve/single', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, meterSN, from, to } = req.query as Record<string, string>;
    if (!siteId || !meterSN || !from || !to) {
      return res.status(400).json({ success: false, error: 'siteId, meterSN, from, to required' });
    }
    const data = await getEnergyCurveSingle(siteId as SiteId, meterSN, from, to);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

reportsRouter.get('/energy-curve/three-phase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, meterSN, from, to } = req.query as Record<string, string>;
    if (!siteId || !meterSN || !from || !to) {
      return res.status(400).json({ success: false, error: 'siteId, meterSN, from, to required' });
    }
    const data = await getEnergyCurveThreePhase(siteId as SiteId, meterSN, from, to);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

reportsRouter.get('/energy-curve/ct', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, meterSN, from, to } = req.query as Record<string, string>;
    if (!siteId || !meterSN || !from || !to) {
      return res.status(400).json({ success: false, error: 'siteId, meterSN, from, to required' });
    }
    const data = await getEnergyCurveCT(siteId as SiteId, meterSN, from, to);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

// ── Daily / Monthly Yield ─────────────────────────────────────
reportsRouter.get('/daily-yield', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getDailyYield(siteParam(req), from, to);
    sendReport(res, data, format, 'daily-yield');
  } catch (err) { next(err); }
});

reportsRouter.get('/monthly-yield', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getMonthlyYield(siteParam(req), from, to);
    sendReport(res, data, format, 'monthly-yield');
  } catch (err) { next(err); }
});

// ── Event Notifications ───────────────────────────────────────
reportsRouter.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, eventType, format = 'json' } = req.query as Record<string, string>;
    if (!from || !to) return res.status(400).json({ success: false, error: 'from and to required' });
    const data = await getEventNotifications(siteParam(req), from, to, eventType);
    sendReport(res, data, format, 'event-notifications');
  } catch (err) { next(err); }
});

// ── Instantaneous Values ──────────────────────────────────────
reportsRouter.get('/instantaneous', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, meterSN } = req.query as Record<string, string>;
    if (!siteId || !meterSN) {
      return res.status(400).json({ success: false, error: 'siteId and meterSN required' });
    }
    if (!SITES.includes(siteId as any)) {
      return res.status(400).json({ success: false, error: `Invalid siteId` });
    }
    const data = await getInstantaneousValues(siteId as SiteId, meterSN);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
