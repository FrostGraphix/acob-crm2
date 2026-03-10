export declare const SITES: readonly ["KYAKALE", "MUSHA", "UMAISHA", "TUNGA", "OGUFA"];
export type SiteId = typeof SITES[number];
export interface DateRange {
    from: string;
    to: string;
}
export interface CreditTokenRecord {
    id: string;
    meterSN: string;
    tokenValue: string;
    amount: number;
    energyUnits: number;
    timestamp: string;
    customerId: string;
    siteId: SiteId;
    operatorId: string;
    status: 'ACTIVE' | 'USED' | 'CANCELLED';
}
export interface CreditTokenRequest {
    meterSN: string;
    amount: number;
    tariffRate: number;
    siteId: SiteId;
    operatorId: string;
}
export interface TokenResponse {
    tokenValue: string;
    energyUnits: number;
    amount: number;
    meterSN: string;
    siteId: SiteId;
    generatedAt: string;
}
export interface HourlyMeterData {
    id: string;
    meterSN: string;
    timestamp: string;
    hour: number;
    activeEnergyImport: number;
    activeEnergyExport: number;
    reactiveEnergyImport: number;
    reactiveEnergyExport: number;
    voltage?: number;
    current?: number;
    powerFactor?: number;
    siteId: SiteId;
}
export interface DailyMeterData {
    meterSN: string;
    date: string;
    totalActiveEnergyImport: number;
    totalActiveEnergyExport: number;
    peakDemand: number;
    siteId: SiteId;
}
export type TaskType = 'READING' | 'CONTROL' | 'TOKEN' | 'SETTING';
export type TaskStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
export type ControlType = 'CONNECT' | 'DISCONNECT' | 'REBOOT';
export interface RemoteTask {
    taskId: string;
    meterSN: string;
    taskType: TaskType;
    status: TaskStatus;
    siteId: SiteId;
    createdAt: string;
    completedAt?: string;
    result?: Record<string, unknown>;
    authorizedBy?: string;
    reason?: string;
}
export type EventType = 'TAMPER_DETECTED' | 'COVER_OPEN' | 'POWER_FAIL' | 'POWER_RESTORE' | 'LOW_CREDIT' | 'REVERSE_ENERGY' | 'OVER_CURRENT' | 'COMMUNICATION_FAIL';
export interface EventNotification {
    id: string;
    meterSN: string;
    eventType: EventType;
    timestamp: string;
    siteId: SiteId;
    description?: string;
    acknowledged: boolean;
}
export interface SiteKPI {
    siteId: SiteId;
    totalRevenue: number;
    totalTokensSold: number;
    totalEnergyKwh: number;
    activeMeters: number;
    offlineMeters: number;
    tamperAlerts: number;
    longNonPurchaseCount: number;
    lowCreditCount: number;
    avgDailyConsumption: number;
    gatewayUptime: number;
}
export interface DashboardData {
    sites: SiteKPI[];
    portfolioRevenue: number;
    portfolioEnergyKwh: number;
    portfolioActiveMeters: number;
    recentTokens: CreditTokenRecord[];
    recentEvents: EventNotification[];
    lastUpdated: string;
}
export interface GprsStatus {
    gatewayId: string;
    siteId: SiteId;
    online: boolean;
    lastSeen: string;
    signalStrength?: number;
    connectedMeters: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    offset: number;
    pageLimit: number;
    hasMore: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface Tariff {
    id: string;
    siteId: SiteId;
    ratePerKwh: number;
    currency: string;
    effectiveFrom: string;
    effectiveTo?: string;
    name: string;
}
export interface Customer {
    id: string;
    name: string;
    accountNumber: string;
    meterSN: string;
    siteId: SiteId;
    phone?: string;
    address?: string;
    tariffId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
//# sourceMappingURL=odyssey.d.ts.map