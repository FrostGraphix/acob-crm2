// ============================================================
// /backend/src/api/operations.ts
// Remote Operations REST routes
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SITES } from '../../../common/types/odyssey';
import type { SiteId } from '../../../common/types/odyssey';
import {
    createReadingTask, createControlTask, createTokenDeliveryTask,
    createSettingTask, pollTaskResult, listRecentTasks,
    getReadingTasks, getControlTasks, getTokenTasks,
} from '../services/operations-service';

export const operationsRouter = Router();

const SiteIdSchema = z.enum([...SITES] as [string, ...string[]]);

// ── POST /reading-task ────────────────────────────────────────
operationsRouter.post('/reading-task', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { meterSN, siteId, operatorId } = z.object({
            meterSN: z.string().min(1),
            siteId: SiteIdSchema,
            operatorId: z.string().min(1),
        }).parse(req.body);

        const task = await createReadingTask(meterSN, siteId as SiteId, operatorId);
        res.status(201).json({ success: true, data: task });
    } catch (err: any) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

// ── POST /control-task ────────────────────────────────────────
operationsRouter.post('/control-task', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { meterSN, siteId, controlType, reason, authorizedBy, secondAuthorizer } = z.object({
            meterSN: z.string().min(1),
            siteId: SiteIdSchema,
            controlType: z.enum(['CONNECT', 'DISCONNECT']),
            reason: z.string().min(1),
            authorizedBy: z.string().min(1),
            secondAuthorizer: z.string().optional().default(''),
        }).parse(req.body);

        const task = await createControlTask(meterSN, siteId as SiteId, controlType, reason, authorizedBy, secondAuthorizer);
        res.status(201).json({ success: true, data: task });
    } catch (err: any) {
        if (err.statusCode === 400) return res.status(400).json({ success: false, error: err.message });
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

// ── POST /token-task ──────────────────────────────────────────
operationsRouter.post('/token-task', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { meterSN, siteId, tokenValue, operatorId } = z.object({
            meterSN: z.string().min(1),
            siteId: SiteIdSchema,
            tokenValue: z.string().length(20, 'Token must be exactly 20 digits'),
            operatorId: z.string().min(1),
        }).parse(req.body);

        const task = await createTokenDeliveryTask(meterSN, siteId as SiteId, tokenValue, operatorId);
        res.status(201).json({ success: true, data: task });
    } catch (err: any) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

// ── POST /setting-task ────────────────────────────────────────
operationsRouter.post('/setting-task', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { meterSN, siteId, settings, operatorId } = z.object({
            meterSN: z.string().min(1),
            siteId: SiteIdSchema,
            settings: z.record(z.unknown()),
            operatorId: z.string().min(1),
        }).parse(req.body);

        const task = await createSettingTask(meterSN, siteId as SiteId, settings, operatorId);
        res.status(201).json({ success: true, data: task });
    } catch (err: any) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
        next(err);
    }
});

// ── GET /task/:taskId ─────────────────────────────────────────
operationsRouter.get('/task/:taskId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId } = req.query as { siteId?: string };
        if (!siteId) return res.status(400).json({ success: false, error: 'siteId is required' });
        SiteIdSchema.parse(siteId);

        const result = await pollTaskResult(req.params.taskId, siteId as SiteId);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// ── GET /tasks ────────────────────────────────────────────────
operationsRouter.get('/tasks', (req: Request, res: Response) => {
    const { siteId, limit } = req.query as { siteId?: string; limit?: string };
    const tasks = listRecentTasks(
        siteId as SiteId | undefined,
        limit ? parseInt(limit, 10) : undefined
    );
    res.json({ success: true, data: tasks, total: tasks.length });
});

// ── GET /tasks/reading ─────────────────────────────────────────
operationsRouter.get('/tasks/reading', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId, from, to } = req.query as Record<string, string>;
        if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
        const data = await getReadingTasks(SiteIdSchema.parse(siteId) as SiteId, from, to);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ── GET /tasks/control ─────────────────────────────────────────
operationsRouter.get('/tasks/control', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId, from, to } = req.query as Record<string, string>;
        if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
        const data = await getControlTasks(SiteIdSchema.parse(siteId) as SiteId, from, to);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ── GET /tasks/token ─────────────────────────────────────────
operationsRouter.get('/tasks/token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { siteId, from, to } = req.query as Record<string, string>;
        if (!siteId || !from || !to) return res.status(400).json({ success: false, error: 'siteId, from, to required' });
        const data = await getTokenTasks(SiteIdSchema.parse(siteId) as SiteId, from, to);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});
