// ============================================================
// ACOB Odyssey — Shared Types
// /common/types/odyssey.ts
// ============================================================

export const SITES = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'] as const;
export type SiteId = typeof SITES[number];

// ── Date Range ───────────────────────────────────────────────
export interface DateRange {
  from: string; // ISO 8601 UTC
  to: string;
}

// ── Credit Token Record ──────────────────────────────────────
export interface CreditTokenRecord {
  id: string;
  meterSN: string;
  tokenValue: string;       // 20-digit STS token
  amount: number;           // Currency units
  energyUnits?: number;     // optional
  kwh?: number;             // kWh credited
  timestamp: string;        // ISO 8601 UTC
  customerId?: string;      // optional
  customerName?: string;
  accountNo?: string;
  tariffRate?: string;
  siteId: SiteId;
  operatorId?: string;
  status?: 'ACTIVE' | 'USED' | 'CANCELLED';
}

// ── Token Generation Request ─────────────────────────────────
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

// ── Hourly Meter Data ────────────────────────────────────────
export interface HourlyMeterData {
  id: string;
  meterSN: string;
  timestamp: string;
  hour: number;
  activeEnergyImport: number;   // kWh
  activeEnergyExport: number;   // kWh
  reactiveEnergyImport: number;
  reactiveEnergyExport: number;
  voltage?: number;
  current?: number;
  powerFactor?: number;
  siteId: SiteId;
}

// ── Daily Meter Data ─────────────────────────────────────────
export interface DailyMeterData {
  meterSN: string;
  date: string;
  totalActiveEnergyImport: number;
  totalActiveEnergyExport: number;
  peakDemand: number;
  siteId: SiteId;
}

// ── Remote Task ──────────────────────────────────────────────
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

// ── Event Notification ───────────────────────────────────────
export type EventType =
  | 'TAMPER_DETECTED'
  | 'COVER_OPEN'
  | 'POWER_FAIL'
  | 'POWER_RESTORE'
  | 'LOW_CREDIT'
  | 'REVERSE_ENERGY'
  | 'OVER_CURRENT'
  | 'COMMUNICATION_FAIL';

export interface EventNotification {
  id: string;
  meterSN: string;
  eventType: EventType;
  timestamp: string;
  siteId: SiteId;
  description?: string;
  acknowledged: boolean;
}

// ── Dashboard KPIs ───────────────────────────────────────────
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
  gatewayUptime: number; // percentage
}

export interface SolarData {
  productionKw: number;
  dailyYieldKwh: number;
  peakPowerKw: number;
  irradiance: number; // W/m2
  efficiency: number; // %
}

export interface BatteryData {
  soc: number; // 0-100
  voltage: number;
  current: number;
  powerKw: number; // Positive = Charging, Negative = Discharging
  capacityKwh: number;
  health: number; // %
  status: 'CHARGING' | 'DISCHARGING' | 'IDLE' | 'STANDBY';
}

export interface FlowMetrics {
  solarToInverterKw: number;
  inverterToBatteryKw: number;
  batteryToInverterKw: number;
  inverterToLoadKw: number;
  gridToInverterKw: number;
  inverterToGridKw: number;
  generatorToInverterKw: number;
}

export interface GenerationStats {
  pvYield: number;
  loadConsumption: number;
  gridImport: number;
  gridExport: number;
  batteryDischarge: number;
  batteryCharge: number;
}

export interface SiteMetadata {
  siteId: SiteId;
  name: string;
  pvCapacityKw: number;
  batteryCapacityKwh: number;
  inverterCapacityKw: number;
  isOnline: boolean;
  weather: {
    temp: number;
    condition: string;
    icon: string;
  };
}

export interface DashboardData {
  sites: SiteKPI[];
  portfolioRevenue: number;
  portfolioEnergyKwh: number;
  portfolioActiveMeters: number;
  recentTokens: CreditTokenRecord[];
  recentEvents: EventNotification[];
  lastUpdated: string;
  // Reference Site Specific Metrics
  accountCount: number;
  purchaseTimes: number;
  purchaseUnit: number;
  purchaseMoney: number;
  // EMS Additions
  selectedSiteMetadata?: SiteMetadata;
  flow?: FlowMetrics;
  generation?: GenerationStats;
  hourlyGeneration?: {
    timestamp: string;
    pv: number;
    load: number;
    battery: number;
    grid: number;
  }[];
}

// ── GPRS Status ──────────────────────────────────────────────
export interface GprsStatus {
  gatewayId: string;
  siteId: SiteId;
  online: boolean;
  lastSeen: string;
  signalStrength?: number;
  connectedMeters: number;
}

// ── Pagination ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  pageLimit: number;
  hasMore: boolean;
}

// ── API Response Envelope ─────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── AMR API V1 Envelope ───────────────────────────────────────
export interface AmrResponse<T> {
  code: number;
  reason: string;
  result: T;
}

// ── AMR API V1 Standard Read Request ──────────────────────────
export interface AmrReadRequest {
  searchTerm?: string;
  stationId?: string;
  pageNumber?: number;
  pageSize?: number;
  orderBy?: string;
  createDateRange?: string[];
  updateDateRange?: string[];
}

export interface AccountReadRequest extends AmrReadRequest {
  customerId?: string;
  customerName?: string;
  meterId?: string;
  meterType?: number;
  protocolVersion?: string;
  communicationWay?: number;
  tariffId?: string;
  ctRatio?: string;
  remark?: string;
}

export interface CustomerReadRequest extends AmrReadRequest {
  customerId?: string;
  customerName?: string;
  type?: number;
  phone?: string;
  address?: string;
  certifiName?: string;
  certifiNo?: string;
  remark?: string;
}

export interface DailyDataMeterReadRequest extends AmrReadRequest {
  currentDateRange?: string[];
  customerId?: string;
  customerName?: string;
  meterId?: string;
  total1?: number;
  gatewayId?: string;
  total2?: number;
  remain1?: number;
  remain2?: number;
  intervalDemand?: number;
  power?: number;
  voltageA?: number;
  voltageB?: number;
  voltageC?: number;
  currentA?: number;
  currentB?: number;
  currentC?: number;
  relayOpen?: boolean;
  batteryLow?: boolean;
  magneticInterference?: boolean;
  terminalCoverOpen?: boolean;
  coverOpen?: boolean;
  source2Activated?: boolean;
  currentReverse?: boolean;
  currentUnbalance?: boolean;
  lang?: string;
}

export interface EventNotificationReadRequest extends AmrReadRequest {
  meterId?: string;
  eventCode?: number;
  currentDateRange?: string[];
  remark?: string;
  lang?: string;
}

export interface GatewayReadRequest extends AmrReadRequest {
  gatewayId?: string;
  gatewayName?: string;
  remark?: string;
}

export interface GPRSMeterTaskRequest {
  customerId: string;
  meterId: string;
  protocolId?: number;
  data?: string;
  stationId: string;
}

export interface GprsOnlineStatusReadRequest extends AmrReadRequest {
  meterId?: string;
  isOnline?: boolean;
}

export interface PrepayReportReadRequest extends AmrReadRequest {
  customerId?: string;
  meterId?: string;
  dateRange?: string[];
  isDaily?: boolean;
  lang?: string;
}

export interface TariffReadRequest extends AmrReadRequest {
  tariffId?: string;
  tariffName?: string;
  price?: string;
  tax?: number;
  remark?: string;
}

export interface TokenCreditTokenRecordReadRequest extends AmrReadRequest {
  receiptId?: number;
  customerId?: string;
  customerName?: string;
  meterId?: string;
  meterType?: number;
  tariffId?: string;
  token?: string;
  tokenFirst?: string;
  tokenSecond?: string;
  tax?: number;
  totalUnit?: number;
  totalPaid?: number;
  remark?: string;
}

// ── Tariff ───────────────────────────────────────────────────
export interface Tariff {
  id: string;
  siteId: SiteId;
  ratePerKwh: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  name: string;
}

// ── Customer ─────────────────────────────────────────────────
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

// ============================================================
// NEW EXACT TABLE MODELS (Matching Reference Site)
// ============================================================

export interface TokenGenerateRow {
  customerId: string;
  customerName: string;
  meterId: string;
  meterType: string;
  communicationWay: string;
  tariffId: string;
}

export interface CreditTokenRecordRow {
  receiptId: string;
  customerId: string;
  customerName: string;
  meterId: string;
  meterType: string;
  tariffId: string;
  vatCharge: number;
  totalUnit: number;
  totalPaid: number;
  tokenRecharge: string;
  vend: string;
  time: string;
  remark: string;
  stationId: string;
}

export interface StandardTokenRecordRow {
  receiptId: string;
  customerId: string;
  customerName: string;
  meterId: string;
  maximumPowerW?: number; // Only for Set Max Power
  token: string;
  createTime: string;
}

export interface RemoteOperationRow {
  status: string;
  customerName: string;
  meterId: string;
  meterType: string;
  remark: string;
  stationId: string;
}

export interface RemoteOperationTaskRow {
  customerId: string;
  customerName: string;
  meterId: string;
  dataItem: string;
  stationId: string;
  dataValue?: string; // For reading
  status: string;
  createTime?: string;
  updateTime?: string;
  remark?: string; // For token
  token?: string; // For token
}

export interface LongNonpurchaseRow {
  customerId: string;
  customerName: string;
  meterId: string;
  tariffId: string;
  lastPurchaseUnit: number;
  lastPurchasePaid: number;
  lastPurchaseDate: string;
  nonpurchaseDays: number;
  stationId: string;
}

export interface LowPurchaseRow {
  customerId: string;
  customerName: string;
  meterId: string;
  tariffId: string;
  totalUnit: number;
  totalPaid: number;
  times: number;
  lastPurchaseUnit: number;
  lastPurchaseDate: string;
  stationId: string;
}

export interface ConsumptionStatisticsRow {
  collectionDate: string;
  consumption: number;
}

export interface IntervalDataRow {
  meterId: string;
  gatewayId: string;
  collectionDate: string;
  customerId: string;
  customerName: string;
  stationId: string;
}

// Management rows
export interface StationManagementRow {
  status: string;
  successRate: string;
  id: string;
  name: string;
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface TariffManagementRow {
  id: string;
  name: string;
  price: number;
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface MeterManagementRow {
  customerId: string;
  meterId: string;
  tariffId: string;
  communicationWay: string;
  ctRatio: string;
  remark: string;
  createTime: string;
  updateTime: string;
  stationId: string;
}

export interface UserManagementRow {
  userName: string;
  roleName: string;
  staffNo: string;
  mobile: string;
  remark: string;
  stationId: string;
}

export interface RoleManagementRow {
  // Not strictly detailed in the subagent response, but usually has id/name/remark/time
  roleId: string;
  roleName: string;
  remark: string;
  createTime: string;
  updateTime: string;
}
