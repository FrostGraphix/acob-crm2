// ============================================================
// /frontend/src/services/operations-api.ts
// Typed API client for Remote Operations
// ============================================================
import axios from 'axios';
import type { RemoteTask, SiteId } from '@common/types/odyssey';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const http = axios.create({ baseURL: `${BASE_URL}/operations`, timeout: 60_000 });
http.interceptors.response.use(r => r, err => Promise.reject(new Error(err.response?.data?.error ?? err.message)));

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

export const operationsApi = {
    createReadingTask: async (meterSN: string, siteId: SiteId, operatorId: string): Promise<TrackedTask> => {
        const res = await http.post('/reading-task', { meterSN, siteId, operatorId });
        return res.data.data;
    },

    createControlTask: async (payload: {
        meterSN: string;
        siteId: SiteId;
        controlType: 'CONNECT' | 'DISCONNECT';
        reason: string;
        authorizedBy: string;
        secondAuthorizer: string;
    }): Promise<TrackedTask> => {
        const res = await http.post('/control-task', payload);
        return res.data.data;
    },

    createTokenTask: async (meterSN: string, siteId: SiteId, tokenValue: string, operatorId: string): Promise<TrackedTask> => {
        const res = await http.post('/token-task', { meterSN, siteId, tokenValue, operatorId });
        return res.data.data;
    },

    createSettingTask: async (meterSN: string, siteId: SiteId, settings: Record<string, unknown>, operatorId: string): Promise<TrackedTask> => {
        const res = await http.post('/setting-task', { meterSN, siteId, settings, operatorId });
        return res.data.data;
    },

    pollTask: async (taskId: string, siteId: SiteId): Promise<TrackedTask | null> => {
        const res = await http.get(`/task/${taskId}`, { params: { siteId } });
        return res.data.data;
    },

    listTasks: async (siteId?: SiteId, limit = 50): Promise<TrackedTask[]> => {
        const res = await http.get('/tasks', { params: { ...(siteId && { siteId }), limit } });
        return res.data.data ?? [];
    },
};
