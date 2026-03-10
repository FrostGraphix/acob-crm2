// ============================================================
// /frontend/src/services/settings-api.ts
// Typed API client for Settings & Admin
// ============================================================
import axios from 'axios';
import type { SiteId } from '@common/types/odyssey';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const http = axios.create({ baseURL: `${BASE_URL}/settings`, timeout: 30_000 });
http.interceptors.response.use(r => r, err => Promise.reject(new Error(err.response?.data?.error ?? err.message)));

export interface Station {
    stationId: string;
    stationName: string;
    siteId: SiteId;
    address?: string;
    longitude?: number;
    latitude?: number;
    remark?: string;
}

export interface Role {
    RoleId: string;
    RoleName: string;
    Description: string;
    scopes: string[];
}

export interface UserRecord {
    UserId: string;
    UserName: string;
    RoleId: string;
    RoleName: string;
    RealName?: string;
    Active: boolean;
}

export const settingsApi = {
    // Stations
    listStations: async (): Promise<Station[]> => {
        const res = await http.get('/stations');
        return res.data.data ?? [];
    },
    updateStation: async (id: string, payload: Partial<Station> & { siteId: SiteId }): Promise<Station> => {
        const res = await http.put(`/stations/${id}`, payload);
        return res.data.data;
    },

    // Roles
    listRoles: async (): Promise<Role[]> => {
        const res = await http.get('/roles');
        return res.data.data ?? [];
    },
    createRole: async (payload: { roleName: string; description: string; scopes: string[] }): Promise<Role> => {
        const res = await http.post('/roles', payload);
        return res.data.data;
    },
    updateRole: async (id: string, payload: Partial<Role>): Promise<Role> => {
        const res = await http.put(`/roles/${id}`, payload);
        return res.data.data;
    },

    // Users
    listUsers: async (): Promise<UserRecord[]> => {
        const res = await http.get('/users');
        return res.data.data ?? [];
    },
    createUser: async (payload: { userName: string; password: string; roleId: string; realName: string }): Promise<UserRecord> => {
        const res = await http.post('/users', payload);
        return res.data.data;
    },
    updateUser: async (id: string, payload: Partial<UserRecord>): Promise<UserRecord> => {
        const res = await http.put(`/users/${id}`, payload);
        return res.data.data;
    },

    // Logs
    listLogs: async (siteId?: SiteId, from?: string, to?: string) => {
        const res = await http.get('/logs', { params: { ...(siteId && { siteId }), from, to } });
        return res.data.data ?? [];
    },
};
