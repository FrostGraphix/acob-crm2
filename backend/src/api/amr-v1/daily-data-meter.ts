// ============================================================
// /backend/src/api/amr-v1/daily-data-meter.ts
// AMR API V1 — Daily/Hourly data readings functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { tokenDataEngine } from '../../services/token-data-engine';
import { DailyDataMeterReadRequest, AmrResponse } from '../../../../common/types/odyssey';

export const dailyDataMeterRouter = Router();

/**
 * POST /api/DailyDataMeter/read
 */
dailyDataMeterRouter.post('/read', async (req: Request, res: Response) => {
    try {
        const body = req.body as DailyDataMeterReadRequest;
        const { siteId } = body as any;
        const meters = await tokenDataEngine.getMeters(siteId);

        const response: AmrResponse<any> = {
            code: 0,
            reason: 'Success',
            result: {
                total: meters.length,
                data: meters.map((m: any) => ({
                    meterId: m.meterSN,
                    customerId: m.accountNo, // Using accountNo as customerId
                    customerName: m.customerName,
                    stationId: m.siteId,
                    usage1: m.totalKwh.toString(),
                    total1: m.totalKwh,
                    voltageA: 230, // Default/Placeholder
                    currentA: 0,
                    createDate: m.lastSeen !== 'N/A' ? m.lastSeen : new Date().toISOString(),
                }))
            }
        };
        res.json(response);
    } catch (err: any) {
        res.json({ code: 1, reason: err.message, result: null });
    }
});

/**
 * GET /api/DailyDataMeter/readHourly
 * Used query params in Swagger (FROM, TO, SITE_ID, meterId, offset, pageLimit)
 */
dailyDataMeterRouter.get('/readHourly', async (req: Request, res: Response) => {
    try {
        const { meterId } = req.query as { meterId?: string };
        const readings = await tokenDataEngine.getMeterDetails(meterId || '');

        const response = {
            total: readings.consumption.length,
            offset: 0,
            pageLimit: 24,
            readings: readings.consumption.map((c: any) => ({
                timestamp: c.month,
                meterId,
                energyConsumptionKwh: c.totalKwh,
                energyReadingKwh: c.totalKwh,
                timeIntervalMinutes: 43200, // Monthly interval approx
            })),
            errors: []
        };
        res.json(response);
    } catch (err: any) {
        res.json({ total: 0, readings: [], errors: [err.message] });
    }
});

/**
 * POST /api/DailyDataMeter/readMore
 */
dailyDataMeterRouter.post('/readMore', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: { total: 0, data: [] } });
});

/**
 * POST /api/DailyDataMeter/readMonthly
 */
dailyDataMeterRouter.post('/readMonthly', async (req: Request, res: Response) => {
    res.json({ code: 0, reason: 'Success', result: { total: 0, data: [] } });
});
