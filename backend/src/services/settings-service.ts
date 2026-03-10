// ============================================================
// /backend/src/services/settings-service.ts
// Settings & Admin — stations, roles, users
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import type { SiteId } from '../../../common/types/odyssey';
import { config } from '../config';

// ════════════════════════════════════════════════════════════
// STATION CONFIG
// ════════════════════════════════════════════════════════════
export async function listStations() {
    const results = await Promise.allSettled(
        config.odyssey.sites.map(async (siteId) => ({
            siteId,
            data: await odysseyClient.post<any>('/station/read', { SITE_ID: siteId, pageSize: 100000, pageNum: 1 }),
        }))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<{ siteId: SiteId; data: any }> => r.status === 'fulfilled')
        .flatMap(r => {
            const data = r.value.data;
            const items = Array.isArray(data) ? data : data?.Data ? (Array.isArray(data.Data) ? data.Data : [data.Data]) : [data];
            return items.map((item: any) => ({ ...item, siteId: r.value.siteId }));
        });
}

export async function getStation(stationId: string, siteId: SiteId) {
    return odysseyClient.post<any>('/station/read', { StationId: stationId, SITE_ID: siteId });
}

export async function updateStation(stationId: string, payload: Record<string, unknown>, siteId: SiteId) {
    logger.info('Updating station', { stationId, siteId });
    return odysseyClient.post<any>('/station/update', { ...payload, StationId: stationId, SITE_ID: siteId });
}

// ════════════════════════════════════════════════════════════
// ROLES
// ════════════════════════════════════════════════════════════
export async function listRoles() {
    try {
        const data = await odysseyClient.post<any>('/role/read', { pageSize: 100000, pageNum: 1 });
        return Array.isArray(data) ? data : data?.Data ? data.Data : [];
    } catch {
        logger.warn('Failed to fetch roles from Odyssey API — returning empty array');
        return [];
    }
}

export async function createRole(payload: { roleName: string; description: string; scopes: string[] }) {
    logger.info('Creating role', { roleName: payload.roleName });
    return odysseyClient.post<any>('/role/create', {
        RoleName: payload.roleName,
        Description: payload.description,
        Scopes: payload.scopes,
    });
}

export async function updateRole(roleId: string, payload: Record<string, unknown>) {
    logger.info('Updating role', { roleId });
    return odysseyClient.post<any>('/role/update', { ...payload, RoleId: roleId });
}

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════
export async function listUsers() {
    try {
        const data = await odysseyClient.get<any>('/Setting/user');
        return Array.isArray(data) ? data : data?.Data ? data.Data : [];
    } catch {
        logger.warn('Failed to fetch users from Odyssey API — returning empty array');
        return [];
    }
}

export async function createUser(payload: {
    userName: string;
    password: string;
    roleId: string;
    realName: string;
}) {
    logger.info('Creating user', { userName: payload.userName });
    return odysseyClient.post<any>('/Setting/user', {
        UserName: payload.userName,
        Password: payload.password,
        RoleId: payload.roleId,
        RealName: payload.realName,
    });
}

export async function updateUser(userId: string, payload: Record<string, unknown>) {
    logger.info('Updating user', { userId });
    return odysseyClient.post<any>('/Setting/user', { ...payload, UserId: userId });
}

// ════════════════════════════════════════════════════════════
// SYSTEM LOGS
// ════════════════════════════════════════════════════════════
export async function getSystemLogs(siteId?: SiteId, from?: string, to?: string) {
    try {
        const params: Record<string, unknown> = {};
        if (siteId) params.SITE_ID = siteId;
        if (from) params.FROM = from;
        if (to) params.TO = to;
        return await odysseyClient.post<any[]>('/Log/read', { ...params, pageSize: 100000, pageNum: 1 });
    } catch {
        return [];
    }
}
