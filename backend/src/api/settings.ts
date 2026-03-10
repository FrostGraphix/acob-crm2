// ============================================================
// /backend/src/api/settings.ts
// Settings & Admin REST routes — stations, roles, users
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SITES } from '../../../common/types/odyssey';
import type { SiteId } from '../../../common/types/odyssey';
import {
    listStations, getStation, updateStation,
    listRoles, createRole, updateRole,
    listUsers, createUser, updateUser,
    getSystemLogs,
} from '../services/settings-service';

export const settingsRouter = Router();
const SiteIdSchema = z.enum([...SITES] as [string, ...string[]]);

// ════════════════════════════════════════════════════════════
// STATIONS
// ════════════════════════════════════════════════════════════
settingsRouter.get('/stations', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await listStations();
        res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
});

settingsRouter.get('/stations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId } = req.query as { siteId?: string };
        if (!siteId) return res.status(400).json({ success: false, error: 'siteId required' });
        SiteIdSchema.parse(siteId);
        const data = await getStation(req.params.id, siteId as SiteId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

settingsRouter.put('/stations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId, ...rest } = req.body;
        SiteIdSchema.parse(siteId);
        const data = await updateStation(req.params.id, rest, siteId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// ROLES
// ════════════════════════════════════════════════════════════
settingsRouter.get('/roles', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await listRoles();
        res.json({ success: true, data, total: Array.isArray(data) ? data.length : 0 });
    } catch (err) { next(err); }
});

settingsRouter.post('/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = z.object({
            roleName: z.string().min(1),
            description: z.string().min(1),
            scopes: z.array(z.string()),
        }).parse(req.body);
        const data = await createRole(body);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

settingsRouter.put('/roles/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await updateRole(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════
settingsRouter.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await listUsers();
        res.json({ success: true, data, total: Array.isArray(data) ? data.length : 0 });
    } catch (err) { next(err); }
});

settingsRouter.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = z.object({
            userName: z.string().min(1),
            password: z.string().min(6),
            roleId: z.string().min(1),
            realName: z.string().min(1),
        }).parse(req.body);
        const data = await createUser(body);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

settingsRouter.put('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await updateUser(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// SYSTEM LOGS
// ════════════════════════════════════════════════════════════
settingsRouter.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId, from, to } = req.query as { siteId?: string; from?: string; to?: string };
        const data = await getSystemLogs(siteId as SiteId | undefined, from, to);
        res.json({ success: true, data, total: Array.isArray(data) ? data.length : 0 });
    } catch (err) { next(err); }
});
