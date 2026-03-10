// ============================================================
// /backend/src/api/dashboard.ts
// Dashboard routes — KPIs, charts, multi-site data
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getDashboardData } from '../services/dashboard-service';
import { odysseyClient } from '../services/odyssey-client';
import { config } from '../config';
import { SITES, SiteId } from '../../../common/types/odyssey';

export const dashboardRouter = Router();

// Cache dashboard data for 5 minutes (keyed by date range)
const dashboardCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_FROM = '2025-01-01T00:00:00.000Z';

// GET /api/dashboard?from=...&to=...&siteId=...
dashboardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from = DEFAULT_FROM, to = new Date().toISOString(), siteId } = req.query as Record<string, string>;
    const cacheKey = `${from}:${to}:${siteId || 'ALL'}`;
    const now = Date.now();
    const cached = dashboardCache.get(cacheKey);

    if (cached && now < cached.expiresAt) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const data = await getDashboardData(from, to, siteId as SiteId);
    dashboardCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/hourly?siteId=KYAKALE&from=...&to=...
dashboardRouter.get('/hourly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, from, to } = req.query as { siteId?: string; from?: string; to?: string };

    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to query params required' });
    }

    if (siteId && siteId !== 'ALL') {
      if (!SITES.includes(siteId as SiteId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid siteId. Must be one of: ${SITES.join(', ')}`,
        });
      }
      const data = await odysseyClient.getHourlyData(siteId as SiteId, from, to);
      return res.json({ success: true, data });
    }

    // All sites
    const data = await odysseyClient.getAllSitesHourlyData(from, to);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/gprs
dashboardRouter.get('/gprs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await odysseyClient.getAllSitesGprsStatus();
    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/events?from=...&to=...
dashboardRouter.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, siteId } = req.query as Record<string, string>;
    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to required' });
    }

    const sites = siteId && SITES.includes(siteId as SiteId)
      ? [siteId as SiteId]
      : config.odyssey.sites;

    const results = await Promise.allSettled(
      sites.map(async s => ({
        siteId: s,
        data: await odysseyClient.getEventNotifications(s, from, to),
      }))
    );

    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
