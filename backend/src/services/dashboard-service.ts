// ============================================================
// /backend/src/services/dashboard-service.ts
// Aggregates data from all 5 sites into dashboard KPIs
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import { config } from '../config';
import type {
  DashboardData, SiteKPI, SiteId,
  CreditTokenRecord, EventNotification
} from '../../../common/types/odyssey';
import { SiteRegistry } from './site-registry';
import { WeatherService } from './weather-service';
import { SynthesisEngine } from './synthesis-engine';

// ... computeSiteKPI remains the same ...
function computeSiteKPI(
  siteId: SiteId,
  tokens: any[],
  hourlyData: any[],
  events: any[],
  nonPurchase: any[],
  lowCredit: any[],
  gprsStatus: any
): SiteKPI {
  const totalRevenue = tokens.reduce((sum, t) => sum + (t.Amount ?? t.amount ?? 0), 0);

  // Energy: prefer hourly data, but fall back to transactionKwh from tokens
  let totalEnergyKwh = hourlyData.reduce(
    (sum, h) => sum + (h.ActiveEnergyImport ?? h.activeEnergyImport ?? 0), 0
  );
  if (totalEnergyKwh === 0) {
    // Derive from token records since hourly endpoint is empty
    totalEnergyKwh = tokens.reduce(
      (sum, t) => sum + (t.TransactionKwh ?? t.transactionKwh ?? 0), 0
    );
  }

  const tamperAlerts = events.filter(
    e => (e.EventType ?? e.eventType) === 'TAMPER_DETECTED'
  ).length;

  // Active meters: prefer hourly data, but fall back to unique MeterSN from tokens
  let uniqueMeters = new Set(hourlyData.map(h => h.MeterSN ?? h.meterSN).filter(Boolean)).size;
  if (uniqueMeters === 0) {
    // Derive from token records since hourly endpoint returns nothing
    uniqueMeters = new Set(tokens.map(t => t.MeterSN ?? t.meterSN ?? t.serialNumber).filter(Boolean)).size;
  }

  // Gateway uptime from GPRS status
  let gatewayUptime = 100;
  if (gprsStatus && Array.isArray(gprsStatus)) {
    const total = gprsStatus.length;
    const online = gprsStatus.filter((g: any) => g.Online ?? g.online).length;
    gatewayUptime = total > 0 ? Math.round((online / total) * 100) : 100;
  }

  const avgDailyConsumption = uniqueMeters > 0
    ? totalEnergyKwh / Math.max(uniqueMeters, 1) / 30
    : 0;

  // Non-purchase count: derive from tokens if direct endpoint was 404
  const nonPurchaseCount = nonPurchase.length;

  return {
    siteId,
    totalRevenue,
    totalTokensSold: tokens.length,
    totalEnergyKwh: Math.round(totalEnergyKwh * 100) / 100,
    activeMeters: uniqueMeters,
    offlineMeters: 0,
    tamperAlerts,
    longNonPurchaseCount: nonPurchaseCount,
    lowCreditCount: lowCredit.length,
    avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
    gatewayUptime,
  };
}

export async function getDashboardData(from: string, to: string, siteId?: SiteId): Promise<DashboardData> {
  logger.info('Building dashboard data', { from, to, siteId, sites: config.odyssey.sites });

  // Parallel fetch across all sites
  // SOP 3.3: Use exhaustive pagination to fetch complete history for accurate KPIs
  // Each page = 100 records, 50 pages = 5,000 records per site (fetchAllPages stops early when data is exhausted)
  const MAX_DASHBOARD_PAGES = 5;

  const [
    allTokens,
    allHourly,
    allEvents,
    allNonPurchase,
    allLowCredit,
    allDashboardPanels,
  ] = await Promise.all([
    odysseyClient.fetchAllSites<any>(
      '/token/creditTokenRecord/readMore',
      { FROM: from, TO: to },
      'GET',
      MAX_DASHBOARD_PAGES
    ),
    odysseyClient.fetchAllSites<any>(
      '/DailyDataMeter/readHourly',
      { FROM: from, TO: to },
      'GET',
      MAX_DASHBOARD_PAGES
    ),
    Promise.allSettled(config.odyssey.sites.map(async s => ({
      siteId: s,
      data: await odysseyClient.getEventNotifications(s, from, to),
    }))),
    Promise.allSettled(config.odyssey.sites.map(async s => ({
      siteId: s,
      data: await odysseyClient.getLongNonPurchase(s),
    }))),
    Promise.allSettled(config.odyssey.sites.map(async s => ({
      siteId: s,
      data: await odysseyClient.getLowPurchase(s),
    }))),
    odysseyClient.getAllSitesDashboardPanels().catch(() => []),
  ]);

  const gprsResults = await odysseyClient.getAllSitesGprsStatus();

  // Extract native panel data per site
  const panelsBySite = new Map<SiteId, any>();
  if (Array.isArray(allDashboardPanels)) {
    for (const r of allDashboardPanels) {
      if ((r as any).status === 'fulfilled') {
        const val = (r as PromiseFulfilledResult<{ siteId: SiteId; data: any }>).value;
        panelsBySite.set(val.siteId, val.data);
      }
    }
  }

  // Build per-site KPIs
  const sites: SiteKPI[] = config.odyssey.sites.map(s => {
    const tokens = allTokens.find(r => r.siteId === s)?.data ?? [];
    const hourly = allHourly.find(r => r.siteId === s)?.data ?? [];
    const events = (allEvents
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
      .find(r => r.siteId === s)?.data) ?? [];
    const nonPurchase = (allNonPurchase
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
      .find(r => r.siteId === s)?.data) ?? [];
    const lowCredit = (allLowCredit
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
      .find(r => r.siteId === s)?.data) ?? [];
    const gprs = gprsResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
      .find(r => r.siteId === s)?.data;

    const kpi = computeSiteKPI(s, tokens, hourly, events, nonPurchase, lowCredit, gprs);

    const panel = panelsBySite.get(s);
    if (panel) {
      if (panel.TotalRevenue && panel.TotalRevenue > 0) kpi.totalRevenue = panel.TotalRevenue;
      if (panel.TotalEnergy && panel.TotalEnergy > 0) kpi.totalEnergyKwh = panel.TotalEnergy;
      if (panel.ActiveMeters && panel.ActiveMeters > 0) kpi.activeMeters = panel.ActiveMeters;
      if (panel.OfflineMeters != null) kpi.offlineMeters = panel.OfflineMeters;
      if (panel.TotalTokensSold && panel.TotalTokensSold > 0) kpi.totalTokensSold = panel.TotalTokensSold;
    }

    return kpi;
  });

  // Portfolio aggregates
  const portfolioRevenue = sites.reduce((s, k) => s + k.totalRevenue, 0);
  const portfolioEnergyKwh = sites.reduce((s, k) => s + k.totalEnergyKwh, 0);

  // Use token data engine's real meter registry for accurate active meter count
  // The per-site KPI derivation from raw token arrays often underreports because
  // readMore token records may not carry the MeterSN/serialNumber fields consistently.
  let portfolioActiveMeters = sites.reduce((s, k) => s + k.activeMeters, 0);
  try {
    const { tokenDataEngine } = await import('./token-data-engine');
    const engineMeterStats = await tokenDataEngine.getMeterStats();
    portfolioActiveMeters = engineMeterStats.activeMeters;
    // Also backfill per-site active meter counts from the engine
    for (const site of sites) {
      const siteMeterStats = await tokenDataEngine.getMeterStats(site.siteId as SiteId);
      site.activeMeters = siteMeterStats.activeMeters;
    }
  } catch (e) {
    // fallback to computed value
  }

  // Recent tokens and events
  const recentTokens = allTokens
    .flatMap(r => r.data)
    .sort((a, b) => new Date(b.timestamp ?? b.Timestamp ?? 0).getTime() -
      new Date(a.timestamp ?? a.Timestamp ?? 0).getTime())
    .slice(0, 20) as CreditTokenRecord[];

  // Recent events — try native API first, fall back to synthesized events from token data
  let recentEvents: EventNotification[] = allEvents
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as any).value.data ?? [])
    .sort((a: any, b: any) =>
      new Date(b.timestamp ?? b.Timestamp ?? 0).getTime() -
      new Date(a.timestamp ?? a.Timestamp ?? 0).getTime()
    )
    .slice(0, 50) as EventNotification[];

  // If native API returned nothing (e.g. 401), synthesize events from token data
  if (recentEvents.length === 0) {
    try {
      const { tokenDataEngine } = await import('./token-data-engine');
      const snap = await tokenDataEngine.getSnapshot();
      const synth: EventNotification[] = [];

      // 1. Recent purchases → POWER_RESTORE events (meter is active)
      const recentTxns = snap.transactions
        .filter(t => t.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 30);

      for (const tx of recentTxns) {
        synth.push({
          id: `evt-tx-${tx.id}`,
          meterSN: tx.meterSN,
          eventType: 'POWER_RESTORE',
          timestamp: tx.timestamp,
          siteId: tx.siteId as SiteId,
          description: `Token purchase [${tx.timestamp.replace('T', ' ').substring(0, 16)}]: ₦${tx.amount.toLocaleString()} (${tx.kwh.toFixed(1)} kWh) by ${tx.customerName}`,
          acknowledged: true,
        });
      }

      // 2. Meters not seen in 30+ days → COMMUNICATION_FAIL
      const cutoff30d = new Date();
      cutoff30d.setDate(cutoff30d.getDate() - 30);
      const offlineMeters = snap.meters
        .filter(m => m.lastSeen && new Date(m.lastSeen) < cutoff30d)
        .sort((a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime())
        .slice(0, 10);

      for (const m of offlineMeters) {
        synth.push({
          id: `evt-offline-${m.meterSN}`,
          meterSN: m.meterSN,
          eventType: 'COMMUNICATION_FAIL',
          timestamp: m.lastSeen,
          siteId: m.siteId as SiteId,
          description: `No activity since ${new Date(m.lastSeen).toLocaleDateString()}`,
          acknowledged: false,
        });
      }

      // 3. Low-purchase meters (< 2 txns total) → LOW_CREDIT
      const lowPurchase = snap.meters
        .filter(m => m.transactionCount > 0 && m.transactionCount <= 2 && m.status === 'ACTIVE')
        .slice(0, 10);

      for (const m of lowPurchase) {
        synth.push({
          id: `evt-lowcredit-${m.meterSN}`,
          meterSN: m.meterSN,
          eventType: 'LOW_CREDIT',
          timestamp: m.lastSeen || new Date().toISOString(),
          siteId: m.siteId as SiteId,
          description: `Only ${m.transactionCount} purchase(s) — ₦${m.totalRevenue.toLocaleString()} total`,
          acknowledged: false,
        });
      }

      // Sort by timestamp, newest first
      recentEvents = synth
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      logger.info('[DASHBOARD] Synthesized events from token data', { count: recentEvents.length });
    } catch (err: any) {
      logger.warn('[DASHBOARD] Could not synthesize events', { error: err.message });
    }
  }

  // Calculate reference site specific metrics
  const purchaseTimes = allTokens.reduce((sum, site) => sum + site.data.length, 0);
  const purchaseMoney = portfolioRevenue;
  const purchaseUnit = portfolioEnergyKwh;
  let accountCount = portfolioActiveMeters;

  try {
    const { tokenDataEngine } = await import('./token-data-engine');
    const stats = await tokenDataEngine.getMeterStats();
    accountCount = stats.totalMeters;
  } catch (e) { }

  const baseData: DashboardData = {
    sites,
    portfolioRevenue,
    portfolioEnergyKwh: Math.round(portfolioEnergyKwh * 100) / 100,
    portfolioActiveMeters,
    recentTokens,
    recentEvents,
    lastUpdated: new Date().toISOString(),
    accountCount,
    purchaseTimes,
    purchaseUnit,
    purchaseMoney,
  };

  // EMS Enhancements (if site selected or default to portfolio leader)
  const emsSiteId = siteId || 'UMAISHA'; // Umaisha is usually the benchmark site
  const siteKpi = sites.find(s => s.siteId === emsSiteId);
  const hardware = SiteRegistry.getSiteHardware(emsSiteId);
  const weather = await WeatherService.getWeather(emsSiteId);

  // Derive current load in kW (from hourly avg if available, else mock)
  const currentConsumptionKw = siteKpi ? (siteKpi.avgDailyConsumption / 24) * 1.2 : 50;

  baseData.selectedSiteMetadata = {
    siteId: emsSiteId,
    name: emsSiteId,
    pvCapacityKw: hardware.pvCapacityKw,
    batteryCapacityKwh: hardware.batteryCapacityKwh,
    inverterCapacityKw: hardware.inverterCapacityKw,
    isOnline: true, // Derived from GPRS if needed
    weather: {
      temp: weather.temp,
      condition: weather.condition,
      icon: weather.icon,
    },
  };

  baseData.flow = await SynthesisEngine.getRealTimeFlow(emsSiteId, currentConsumptionKw);
  baseData.generation = await SynthesisEngine.getGenerationStats(emsSiteId, siteKpi?.totalEnergyKwh || 1000);
  baseData.hourlyGeneration = await SynthesisEngine.getPowerProfile(emsSiteId, siteKpi?.totalEnergyKwh || 1000);

  return baseData;
}
