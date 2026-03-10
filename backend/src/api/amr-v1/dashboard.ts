// ============================================================
// /backend/src/api/amr-v1/dashboard.ts
// AMR API V1 - Dashboard functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { tokenDataEngine } from '../../services/token-data-engine';
import { AmrResponse } from '../../../../common/types/odyssey';

export const dashboardRouter = Router();

/**
 * POST /api/dashboard/readPanelGroup
 */
dashboardRouter.post('/readPanelGroup', async (_req: Request, res: Response) => {
  try {
    const [statsRecord, snapshot] = await Promise.all([
      tokenDataEngine.getSiteStats(),
      tokenDataEngine.getSnapshot(),
    ]);

    const stats = Object.entries(statsRecord).map(([siteId, value]) => ({
      siteId,
      ...(value as any),
    }));

    const totalPurchaseMoney = stats.reduce((acc, s: any) => acc + (s.revenue ?? 0), 0);
    const totalPurchaseUnit = stats.reduce((acc, s: any) => acc + (s.kwh ?? 0), 0);
    const totalAccountCount = snapshot.customers.length;
    const totalPurchaseTimes = snapshot.transactions.length;

    const response: AmrResponse<any> = {
      code: 0,
      reason: 'Success',
      result: {
        // Fields expected by the frontend clone
        totalAccountCount,
        totalPurchaseTimes,
        totalPurchaseUnit,
        totalPurchaseMoney,

        // Backward-compatible fields
        portfolioRevenue: totalPurchaseMoney,
        portfolioEnergyKwh: totalPurchaseUnit,
        portfolioActiveMeters: snapshot.meters.filter(m => m.status === 'ACTIVE').length,
        sites: stats,
      },
    };

    res.json(response);
  } catch (err: any) {
    res.json({ code: 1, reason: err.message, result: null });
  }
});

/**
 * POST /api/dashboard/readLineChart
 */
dashboardRouter.post('/readLineChart', async (req: Request, res: Response) => {
  try {
    const chartType = Number(req.body?.type ?? 1);

    let xData: string[] = [];
    let yData: number[] = [];

    if (chartType === 3) {
      const [nonPurchase, lowPurchase, snapshot] = await Promise.all([
        tokenDataEngine.getNonPurchaseMeters(30),
        tokenDataEngine.getLowPurchaseMeters(1000),
        tokenDataEngine.getSnapshot(),
      ]);

      xData = ['Long Nonpurchase', 'Low Purchase', 'Inactive Meters'];
      yData = [
        nonPurchase.length,
        lowPurchase.length,
        snapshot.meters.filter(m => m.status === 'INACTIVE').length,
      ];
    } else {
      const readings = await tokenDataEngine.getConsumptionAnalytics();
      const sorted = [...readings]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      xData = sorted.map(r => r.date);

      if (chartType === 1) {
        yData = sorted.map(r => r.totalRevenue);
      } else if (chartType === 2) {
        yData = sorted.map(r => (r.dayTransactions + r.nightTransactions > 0 ? 100 : 0));
      } else {
        yData = sorted.map(r => r.totalKwh);
      }
    }

    const response: AmrResponse<any> = {
      code: 0,
      reason: 'Success',
      result: {
        // Fields expected by frontend
        xData,
        yData,

        // Backward-compatible aliases
        timestamps: xData,
        values: yData,
      },
    };

    res.json(response);
  } catch (err: any) {
    res.json({ code: 1, reason: err.message, result: null });
  }
});
