// ============================================================
// /backend/src/services/operations-service.ts
// Remote Operations — meter tasks, polling, dual-auth control
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import type { SiteId } from '../../../common/types/odyssey';

// ── In-memory task registry (production: use Redis or DB) ────
interface TrackedTask {
    taskId: string;
    meterSN: string;
    siteId: SiteId;
    taskType: 'READING' | 'CONTROL' | 'TOKEN' | 'SETTING';
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
    createdAt: string;
    completedAt?: string;
    createdBy: string;
    result?: any;
    meta?: Record<string, unknown>;
}

// TODO: PRODUCTION — In-memory task store. Tasks are lost on server restart.
// For production, consider Redis or a database table for persistence.
const taskStore: TrackedTask[] = [];

// ── CREATE READING TASK ──────────────────────────────────────
export async function createReadingTask(
    meterSN: string,
    siteId: SiteId,
    operatorId: string
): Promise<TrackedTask> {
    logger.info('Creating reading task', { meterSN, siteId, operatorId });

    const response = await odysseyClient.createReadingTask(meterSN, siteId);
    const taskId = response?.TaskId ?? response?.taskId ?? `RT-${Date.now()}`;

    const task: TrackedTask = {
        taskId,
        meterSN,
        siteId,
        taskType: 'READING',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        createdBy: operatorId,
    };
    taskStore.unshift(task);
    return task;
}

// ── CREATE CONTROL TASK (dual-auth) ──────────────────────────
export async function createControlTask(
    meterSN: string,
    siteId: SiteId,
    controlType: 'CONNECT' | 'DISCONNECT',
    reason: string,
    authorizedBy: string,
    secondAuthorizer: string
): Promise<TrackedTask> {
    // MANDATORY: Dual authorization for disconnect
    if (controlType === 'DISCONNECT' && !secondAuthorizer) {
        throw Object.assign(
            new Error('Disconnect operations require dual authorization (four-eyes principle)'),
            { statusCode: 400 }
        );
    }

    if (controlType === 'DISCONNECT' && authorizedBy === secondAuthorizer) {
        throw Object.assign(
            new Error('Dual authorization requires two different operators'),
            { statusCode: 400 }
        );
    }

    logger.info('Creating control task', {
        meterSN, siteId, controlType, reason, authorizedBy, secondAuthorizer,
    });

    const response = await odysseyClient.post<any>('/RemoteMeterTask/CreateControlTask', {
        MeterSN: meterSN,
        ControlType: controlType,
        Reason: reason,
        AuthorizedBy: authorizedBy,
        SITE_ID: siteId,
    });

    const taskId = response?.TaskId ?? response?.taskId ?? `CT-${Date.now()}`;

    const task: TrackedTask = {
        taskId,
        meterSN,
        siteId,
        taskType: 'CONTROL',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        createdBy: authorizedBy,
        meta: { controlType, reason, secondAuthorizer },
    };
    taskStore.unshift(task);
    return task;
}

// ── CREATE TOKEN DELIVERY TASK ───────────────────────────────
export async function createTokenDeliveryTask(
    meterSN: string,
    siteId: SiteId,
    tokenValue: string,
    operatorId: string
): Promise<TrackedTask> {
    logger.info('Creating remote token delivery', { meterSN, siteId, operatorId });

    const response = await odysseyClient.post<any>('/RemoteMeterTask/CreateTokenTask', {
        MeterSN: meterSN,
        TokenValue: tokenValue,
        SITE_ID: siteId,
    });

    const taskId = response?.TaskId ?? response?.taskId ?? `TT-${Date.now()}`;

    const task: TrackedTask = {
        taskId,
        meterSN,
        siteId,
        taskType: 'TOKEN',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        createdBy: operatorId,
        meta: { tokenValue },
    };
    taskStore.unshift(task);
    return task;
}

// ── CREATE SETTING TASK ──────────────────────────────────────
export async function createSettingTask(
    meterSN: string,
    siteId: SiteId,
    settings: Record<string, unknown>,
    operatorId: string
): Promise<TrackedTask> {
    logger.info('Creating setting task', { meterSN, siteId, operatorId });

    const response = await odysseyClient.post<any>('/RemoteMeterTask/CreateSettingTask', {
        MeterSN: meterSN,
        SITE_ID: siteId,
        ...settings,
    });

    const taskId = response?.TaskId ?? response?.taskId ?? `ST-${Date.now()}`;

    const task: TrackedTask = {
        taskId,
        meterSN,
        siteId,
        taskType: 'SETTING',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        createdBy: operatorId,
        meta: settings,
    };
    taskStore.unshift(task);
    return task;
}

// ── POLL TASK RESULT ─────────────────────────────────────────
export async function pollTaskResult(taskId: string, siteId: SiteId): Promise<TrackedTask | null> {
    const tracked = taskStore.find((t) => t.taskId === taskId);

    try {
        const result = await odysseyClient.getReadingTaskResult(taskId, siteId);
        const status = result?.Status ?? result?.status ?? 'PENDING';

        if (tracked) {
            tracked.status = status;
            if (status === 'SUCCESS' || status === 'FAILED' || status === 'TIMEOUT') {
                tracked.completedAt = new Date().toISOString();
                tracked.result = result;
            }
        }

        return tracked ?? { taskId, meterSN: '', siteId, taskType: 'READING', status, createdAt: '', createdBy: '', result };
    } catch (err) {
        logger.warn('Failed to poll task', { taskId, siteId });
        return tracked ?? null;
    }
}

// ── LIST RECENT TASKS ────────────────────────────────────────
export function listRecentTasks(siteId?: SiteId, limit = 50): TrackedTask[] {
    let tasks = [...taskStore];
    if (siteId) tasks = tasks.filter((t) => t.siteId === siteId);
    return tasks.slice(0, limit);
}

// ── GET TASK HISTORIES (Native from Odyssey) ─────────────────
export async function getReadingTasks(siteId: SiteId, from: string, to: string) {
    return odysseyClient.getReadingTasks(siteId, from, to);
}

export async function getControlTasks(siteId: SiteId, from: string, to: string) {
    return odysseyClient.getControlTasks(siteId, from, to);
}

export async function getTokenTasks(siteId: SiteId, from: string, to: string) {
    return odysseyClient.getTokenTasks(siteId, from, to);
}
