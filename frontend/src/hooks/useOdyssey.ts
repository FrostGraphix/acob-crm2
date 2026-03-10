// ============================================================
// /frontend/src/hooks/useOdyssey.ts
// Data fetching hooks with loading / error states
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import {
  DashboardData, CreditTokenRecord, HourlyMeterData, SiteId
} from '@common/types/odyssey';

function useAsync<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Dashboard ─────────────────────────────────────────────────
export function useDashboard(from: string, to: string, siteId?: SiteId) {
  return useAsync<any>(async () => {
    // 1. Fetch Top 4 Stats Panel
    const panel = await apiClient.dashboard.readPanelGroup();

    // 2. Fetch the 4 specific charts via Swagger endpoints
    const [chart1, chart2, chart3, chart4] = await Promise.all([
      apiClient.dashboard.readLineChart({ type: 1 }).catch(() => null), // Purchase Money
      apiClient.dashboard.readLineChart({ type: 2 }).catch(() => null), // Hourly Success Rate
      apiClient.dashboard.readLineChart({ type: 3 }).catch(() => null), // Abnormal Alarm
      apiClient.dashboard.readLineChart({ type: 4 }).catch(() => null)  // Daily Consumption
    ]);

    // 3. Map to DashboardData structure for UI exact cloning
    return {
      accountCount: panel?.totalAccountCount || 0,
      purchaseTimes: panel?.totalPurchaseTimes || 0,
      purchaseUnit: panel?.totalPurchaseUnit || 0,
      purchaseMoney: panel?.totalPurchaseMoney || 0,
      charts: {
        purchaseMoney: chart1 || { xData: [], yData: [] },
        hourlySuccess: chart2 || { xData: [], yData: [] },
        abnormalAlarm: chart3 || { xData: [], yData: [] },
        dailyConsumption: chart4 || { xData: [], yData: [] }
      },
      recentEvents: [],
      flow: null,
      selectedSiteMetadata: null,
    };
  }, [from, to, siteId]);
}

// ── Token Records ─────────────────────────────────────────────
export function useTokenRecords(siteId: SiteId | 'ALL', from: string, to: string) {
  return useAsync<CreditTokenRecord[]>(
    async () => {
      const { data } = await apiClient.token.readCreditRecords({
        stationId: siteId === 'ALL' ? undefined : siteId,
        pageNumber: 1,
        pageSize: 1000
      });
      return data.map((t: any) => ({
        id: t.receiptId,
        meterSN: t.meterId,
        siteId: t.stationId,
        customerName: t.customerName,
        accountNo: t.meterId,
        amount: t.totalPaid,
        kwh: t.totalPaid / 100,
        tariffRate: 'Standard',
        tokenValue: t.token,
        timestamp: t.time
      }));
    },
    [siteId, from, to]
  );
}

// ── Hourly Data ───────────────────────────────────────────────
export function useHourlyData(siteId: SiteId | 'ALL', from: string, to: string) {
  return useAsync(
    () => apiClient.getHourlyData(siteId, from, to),
    [siteId, from, to]
  );
}

// ── GPRS Status ───────────────────────────────────────────────
export function useGprsStatus() {
  return useAsync(() => apiClient.getGprsStatus(), []);
}
