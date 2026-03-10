// ============================================================
// /frontend/src/pages/ReportsPage.tsx
// Data Reports — viz-first redesign, all 5 sites, CSV export
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileBarChart, AlertTriangle, TrendingDown, Zap,
  Activity, BarChart3, Calendar, RefreshCw, Download, Layers, TrendingUp, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, AreaChart, Area
} from 'recharts';
import { reportsApi } from '../services/reports-api';
import { ReportTable } from '../components/Reports/ReportTable';
import { ConsumptionAnalytics } from '../components/Management/ConsumptionAnalytics';
import { DateRangePicker, DatePresets } from '../components/ui/DateRangePicker';
import { Select } from '../components/ui/Modal';
import { SITES, type SiteId } from '@common/types/odyssey';
import { SITE_COLORS, formatCurrency, formatKwh, formatNumber, cn } from '../lib/utils';

const REPORT_TABS = [
  { id: 'consumption-analytics', label: 'Robust Analytics', icon: BarChart3 },
  { id: 'daily-yield', label: 'Daily Yield', icon: BarChart3 },
  { id: 'monthly-yield', label: 'Monthly Yield', icon: Calendar },
  { id: 'consumption', label: 'Consumption Stats', icon: Activity },
  { id: 'daily-amr', label: 'Daily AMR', icon: Zap },
  { id: 'monthly-amr', label: 'Monthly AMR', icon: FileBarChart },
  { id: 'non-purchase', label: 'Non-Purchase', icon: AlertTriangle },
  { id: 'low-purchase', label: 'Low Purchase', icon: TrendingDown },
  { id: 'events', label: 'Event Log', icon: Activity },
] as const;

type TabId = typeof REPORT_TABS[number]['id'];

const EVENT_TYPES = [
  'ALL', 'TAMPER_DETECTED', 'COVER_OPEN', 'POWER_FAIL', 'POWER_RESTORE',
  'LOW_CREDIT', 'REVERSE_ENERGY', 'OVER_CURRENT', 'COMMUNICATION_FAIL',
];

export function ReportsPage() {
  const defaultRange = { from: '2025-01-01T00:00:00.000Z', to: new Date().toISOString() };
  const [activeTab, setActiveTab] = useState<TabId | 'consumption-analytics'>('consumption-analytics');
  const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [eventType, setEventType] = useState('ALL');
  const [dayThreshold, setDayThreshold] = useState('30');
  const [amountThreshold, setAmountThreshold] = useState('500');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (activeTab === 'consumption-analytics') return;
    setLoading(true); setError(null);
    try {
      let result: any[] = [];
      switch (activeTab) {
        case 'non-purchase':
          result = await reportsApi.nonPurchase(filterSite, parseInt(dayThreshold));
          break;
        case 'low-purchase':
          result = await reportsApi.lowPurchase(filterSite, parseFloat(amountThreshold));
          break;
        case 'consumption':
          result = await reportsApi.consumption(filterSite, from, to);
          break;
        case 'daily-yield':
          result = await reportsApi.dailyYield(filterSite, from, to);
          break;
        case 'monthly-yield':
          result = await reportsApi.monthlyYield(filterSite, from, to);
          break;
        case 'daily-amr':
          result = await reportsApi.dailyAmr(filterSite, from, to);
          break;
        case 'monthly-amr':
          result = await reportsApi.monthlyAmr(filterSite, from, to);
          break;
        case 'events':
          result = await reportsApi.events(filterSite, from, to, eventType === 'ALL' ? undefined : eventType);
          break;
      }
      setData(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTab, filterSite, from, to, eventType, dayThreshold, amountThreshold]);

  useEffect(() => { load(); }, [load]);

  // Restructure all rows flat for easy processing
  const allRows = useMemo(() => {
    return data.flatMap((g: any) => (g.data ?? []).map((d: any) => ({ ...d, _siteId: g.siteId })));
  }, [data]);

  const totalRecords = allRows.length;

  // Build chart metrics
  const siteChartData = useMemo(() => {
    return data.map((g: any) => {
      const rows = g.data ?? [];
      return {
        site: g.siteId,
        count: rows.length,
        energy: rows.reduce((s: number, r: any) => s + (r.ActiveEnergyImport ?? r.activeEnergyImport ?? r.Energy ?? r.TotalConsumption ?? r.TotalEnergy ?? 0), 0),
        revenue: rows.reduce((s: number, r: any) => s + (r.Amount ?? r.amount ?? r.TotalPurchaseAmount ?? r.Revenue ?? 0), 0),
      };
    }).sort((a, b) => b.energy - a.energy || b.count - a.count);
  }, [data]);

  const timeSeriesData = useMemo(() => {
    if (!['daily-yield', 'daily-amr', 'monthly-yield', 'monthly-amr', 'events'].includes(activeTab)) return [];

    // Group by date
    const grouped = allRows.reduce((acc: any, row: any) => {
      const dateKey = row.Date || row.Month || (row.Timestamp ? new Date(row.Timestamp).toLocaleDateString() : 'Unknown');
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, energy: 0, revenue: 0, events: 0 };

      acc[dateKey].energy += (row.TotalEnergy || row.TotalConsumption || row.ActiveEnergyImport || 0);
      acc[dateKey].revenue += (row.Revenue || row.TotalPurchaseAmount || 0);
      acc[dateKey].events += 1;

      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allRows, activeTab]);

  const kpis = useMemo(() => {
    if (activeTab === 'events') {
      return [
        { label: 'Total Events', value: totalRecords, format: (v: number) => formatNumber(v, 0), icon: AlertTriangle, color: '#f59e0b' },
        { label: 'Sites Affected', value: data.filter(g => g.data?.length > 0).length, format: (v: number) => formatNumber(v, 0), icon: Layers, color: '#0ea5e9' },
      ];
    }

    const totEnergy = siteChartData.reduce((s, d) => s + d.energy, 0);
    const totRev = siteChartData.reduce((s, d) => s + d.revenue, 0);

    return [
      { label: 'Total Records', value: totalRecords, format: (v: number) => formatNumber(v, 0), icon: Layers, color: '#64748b' },
      ...(totEnergy > 0 ? [{ label: 'Total Energy', value: totEnergy, format: (v: number) => formatKwh(v), icon: Zap, color: '#06D6A0' }] : []),
      ...(totRev > 0 ? [{ label: 'Total Revenue', value: totRev, format: (v: number) => formatCurrency(v), icon: DollarSign, color: '#FFB703' }] : []),
      ...(['low-purchase', 'non-purchase'].includes(activeTab) ? [{ label: 'Flagged Meters', value: totalRecords, format: (v: number) => formatNumber(v, 0), icon: AlertTriangle, color: '#ef4444' }] : []),
    ];
  }, [activeTab, siteChartData, totalRecords, data]);

  function getCsvUrl() {
    if (activeTab === 'consumption-analytics') return '#';
    const endpointMap: Record<TabId, string> = {
      'consumption-analytics': '',
      'non-purchase': 'non-purchase', 'low-purchase': 'low-purchase',
      'consumption': 'consumption', 'daily-yield': 'daily-yield',
      'monthly-yield': 'monthly-yield', 'daily-amr': 'daily-amr',
      'monthly-amr': 'monthly-amr', 'events': 'events',
    };
    const p: Record<string, any> = { siteId: filterSite };
    if (['consumption', 'daily-yield', 'monthly-yield', 'daily-amr', 'monthly-amr', 'events'].includes(activeTab)) {
      p.from = from; p.to = to;
    }
    if (activeTab === 'non-purchase') p.dayThreshold = dayThreshold;
    if (activeTab === 'low-purchase') p.amountThreshold = amountThreshold;
    if (activeTab === 'events' && eventType !== 'ALL') p.eventType = eventType;
    return reportsApi.exportCsv(endpointMap[activeTab], p);
  }

  const COLUMNS: Record<TabId, { key: string; label: string; render?: (v: any, r: any) => any }[]> = {
    'consumption-analytics': [],
    'non-purchase': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'LastPurchaseDate', label: 'Last Purchase', render: v => v ? new Date(v).toLocaleDateString() : '—' },
      { key: 'DaysSinceLastPurchase', label: 'Days Inactive', render: v => <span className="text-amber-400 font-medium">{v ?? '—'}</span> },
      { key: 'CustomerName', label: 'Customer' },
    ],
    'low-purchase': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'TotalPurchaseAmount', label: 'Total Amount', render: v => formatCurrency(v ?? 0) },
      { key: 'PurchaseCount', label: 'Purchases' },
      { key: 'CustomerName', label: 'Customer' },
    ],
    'consumption': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'TotalConsumption', label: 'Total kWh', render: v => formatKwh(v ?? 0) },
      { key: 'AverageDailyConsumption', label: 'Avg Daily', render: v => `${formatNumber(v ?? 0)} kWh` },
      { key: 'PeakDemand', label: 'Peak kW', render: v => `${formatNumber(v ?? 0)} kW` },
    ],
    'daily-yield': [
      { key: 'Date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
      { key: 'TotalEnergy', label: 'Energy', render: v => formatKwh(v ?? 0) },
      { key: 'MeterCount', label: 'Meters' },
      { key: 'Revenue', label: 'Revenue', render: v => v ? formatCurrency(v) : '—' },
    ],
    'monthly-yield': [
      { key: 'Month', label: 'Month', render: v => v ? new Date(v).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—' },
      { key: 'TotalEnergy', label: 'Energy', render: v => formatKwh(v ?? 0) },
      { key: 'MeterCount', label: 'Meters' },
      { key: 'Revenue', label: 'Revenue', render: v => v ? formatCurrency(v) : '—' },
    ],
    'daily-amr': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'Date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
      { key: 'ActiveEnergyImport', label: 'Import kWh', render: v => formatKwh(v ?? 0) },
      { key: 'ActiveEnergyExport', label: 'Export kWh', render: v => formatKwh(v ?? 0) },
      { key: 'PeakDemand', label: 'Peak kW', render: v => v ? `${formatNumber(v)} kW` : '—' },
    ],
    'monthly-amr': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'Month', label: 'Month', render: v => v ? new Date(v).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '—' },
      { key: 'ActiveEnergyImport', label: 'Import kWh', render: v => formatKwh(v ?? 0) },
      { key: 'ActiveEnergyExport', label: 'Export kWh', render: v => formatKwh(v ?? 0) },
    ],
    'events': [
      { key: 'MeterSN', label: 'Meter SN' },
      { key: 'EventType', label: 'Event', render: v => <span className="text-amber-400 font-mono text-xs">{v ?? '—'}</span> },
      { key: 'Timestamp', label: 'Time', render: v => v ? new Date(v).toLocaleString() : '—' },
      { key: 'Description', label: 'Description', render: v => <span className="truncate max-w-[300px] block" title={v}>{v ?? '—'}</span> },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">Intelligence & Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data insights, yielding analysis, and site-wide reporting
          </p>
        </div>
        {activeTab !== 'consumption-analytics' && (
          <a href={getCsvUrl()} download className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-odyssey-electric text-odyssey-surface font-semibold text-sm hover:opacity-90 transition-all electric-glow shadow-md">
            <Download className="w-4 h-4" />
            Export Selected
          </a>
        )}
      </div>

      {/* Report type tabs — horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-odyssey-border">
        {REPORT_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2',
              activeTab === id
                ? 'bg-odyssey-electric/5 text-odyssey-electric border-odyssey-electric'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      {activeTab !== 'consumption-analytics' && (
        <div className="glass rounded-xl border border-odyssey-border p-4 flex flex-wrap items-center gap-4 bg-black/20 backdrop-blur-md">
          {/* Site filter */}
          <div className="relative">
            <Select value={filterSite} onChange={e => setFilterSite(e.target.value as any)} className="w-40 py-2.5 pl-4 pr-8 text-xs font-medium rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <option value="ALL">All Sites</option>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          {/* Date range — most reports */}
          {!['non-purchase', 'low-purchase'].includes(activeTab) && (
            <>
              <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
              <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
              <DatePresets onSelect={(f, t) => { setFrom(f); setTo(t); }} />
            </>
          )}

          {/* Day threshold — non-purchase */}
          {activeTab === 'non-purchase' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs text-muted-foreground font-medium">Inactive ≥</span>
              <input
                type="number"
                value={dayThreshold}
                onChange={e => setDayThreshold(e.target.value)}
                className="w-16 bg-transparent text-white font-mono text-sm text-center focus:outline-none"
              />
              <span className="text-xs text-muted-foreground font-medium">days</span>
            </div>
          )}

          {/* Amount threshold — low purchase */}
          {activeTab === 'low-purchase' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs text-muted-foreground font-medium">Total ≤ ₦</span>
              <input
                type="number"
                value={amountThreshold}
                onChange={e => setAmountThreshold(e.target.value)}
                className="w-24 bg-transparent text-white font-mono text-sm text-center focus:outline-none"
              />
            </div>
          )}

          {/* Event type filter */}
          {activeTab === 'events' && (
            <Select value={eventType} onChange={e => setEventType(e.target.value)} className="w-48 py-2.5 pl-4 pr-8 text-xs font-medium rounded-lg bg-white/5 border-white/10 hover:bg-white/10">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Event Types' : t.replace(/_/g, ' ')}</option>)}
            </Select>
          )}

          <button onClick={load} disabled={loading} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:text-odyssey-electric hover:bg-white/10 transition-colors ml-auto group">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-odyssey-electric' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-100 text-sm">Report Generation Failed</h4>
            <p className="text-sm text-red-200/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── VISUALIZATIONS SECTION ────────────────────────────────────────── */}
      {!loading && activeTab !== 'consumption-analytics' && data.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* Dynamic KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="glass rounded-xl border border-odyssey-border p-5 flex items-center justify-between group hover:border-odyssey-mid/40 transition-colors">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-display font-bold text-white tracking-tight">
                    {kpi.format(kpi.value as number)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Primary Bar Chart by Site */}
            <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
              <h3 className="font-display font-semibold text-white text-sm mb-4">
                {['consumption', 'daily-yield', 'monthly-yield', 'daily-amr', 'monthly-amr'].includes(activeTab) ? 'Energy Distribution by Site' : 'Records by Site'}
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={siteChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                  <XAxis dataKey="site" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#ffffff0a' }}
                    contentStyle={{ background: '#1a1c23', border: '1px solid #2a2d35', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Bar dataKey={['consumption', 'daily-yield', 'monthly-yield', 'daily-amr', 'monthly-amr'].includes(activeTab) ? 'energy' : 'count'} radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {siteChartData.map((d: any) => <Cell key={d.site} fill={SITE_COLORS[d.site as SiteId] || '#06D6A0'} fillOpacity={0.9} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Secondary Trend Chart */}
            {timeSeriesData.length > 0 && (
              <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
                <h3 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-odyssey-electric" />
                  {activeTab === 'events' ? 'Event Frequency' : 'Energy Trend Over Time'}
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => {
                      const d = new Date(val);
                      return isNaN(d.getTime()) ? val : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                    }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a1c23', border: '1px solid #2a2d35', borderRadius: '12px', fontSize: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey={activeTab === 'events' ? 'events' : 'energy'} stroke="#06D6A0" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data table */}
      {activeTab !== 'consumption-analytics' && (
        <div className="mt-8 animate-fade-in">
          <ReportTable
            groups={data}
            columns={COLUMNS[activeTab]}
            loading={loading}
            total={totalRecords}
            csvUrl={getCsvUrl()}
            emptyMessage={`No ${REPORT_TABS.find(t => t.id === activeTab)?.label ?? ''} data for this period.`}
          />
        </div>
      )}

      {/* Consumption Analytics custom component */}
      {activeTab === 'consumption-analytics' && (
        <ConsumptionAnalytics />
      )}
    </div>
  );
}
