// ============================================================
// /backend/src/api/amr-v1/station.ts
// AMR API V1 — Station (Site) functional group
// ============================================================
import { Router, Request, Response } from 'express';
import { SITES } from '../../../../common/types/odyssey';

export const stationRouter = Router();

/**
 * POST /api/station/read
 */
stationRouter.post('/read', async (req: Request, res: Response) => {
    const data = SITES.map(site => ({
        id: site,
        name: site,
        remark: `Utility site in ${site}`,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
    }));
    res.json({ code: 0, reason: 'Success', result: { total: data.length, data } });
});
