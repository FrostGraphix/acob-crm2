// ============================================================
// /frontend/src/pages/DashboardPage.tsx
// Main dashboard — all 5 sites, KPIs, charts, events
// ============================================================
import { useState, useMemo, useEffect } from 'react';
import {
  Zap, TrendingUp, Activity, Users,
  AlertTriangle, RefreshCw, ChevronDown,
  Sun, Battery, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../hooks/useOdyssey';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { apiClient } from '../services/api';
import { cn, SITE_COLORS } from '../lib/utils';
import { SITES, type SiteId } from '@common/types/odyssey';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

// PIE COLORS
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- Sub-components ---

function ReferenceStats({ stats, loading }: { stats: any, loading: boolean }) {
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 glass rounded-xl shimmer-bg" />)}
  </div>;

  const items = [
    { label: 'Account Count', value: stats.accountCount, unit: '', icon: Users, color: '#06D6A0' },
    { label: 'Purchase Times', value: stats.purchaseTimes, unit: '', icon: RefreshCw, color: '#00B4D8' },
    { label: 'Purchase Unit', value: stats.purchaseUnit, unit: 'kWh', icon: Zap, color: '#FFB703' },
    { label: 'Purchase Money', value: stats.purchaseMoney, unit: 'NGN', icon: TrendingUp, color: '#EF4444' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, i) => (
        <div key={i} className="glass p-5 rounded-xl border border-odyssey-border/50 flex items-center justify-between group hover:border-odyssey-mid/40 transition-colors shadow-sm cursor-default">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">{item.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-white tracking-tight">
                {typeof item.value === 'number' && item.unit === 'NGN'
                  ? '₦' + item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : item.value?.toLocaleString() ?? 0}
              </span>
              {item.unit && item.unit !== 'NGN' && <span className="text-xs text-muted-foreground font-medium ml-0.5">{item.unit}</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl transition-colors duration-300" style={{ backgroundColor: `${item.color}15` }}>
            <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusTicker() {
  const [messages] = useState([
    "UMAISHA: Battery reaching 85% SOC",
    "MUSHA: Solar Generation peaking at 42kW",
    "OGUFA: High consumption detected on Meter 0012",
    "KYAKALE: System health optimal",
    "TUNGA: Communication link stable"
  ]);

  return (
    <div className="glass h-12 rounded-xl mb-8 border border-odyssey-blue/20 flex items-center px-4 overflow-hidden shadow-[0_0_15px_-5px_rgba(0,180,216,0.15)] relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-odyssey-surface to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-odyssey-surface to-transparent z-10" />

      <div className="flex items-center gap-2.5 mr-6 shrink-0 relative z-20 bg-odyssey-surface/80 px-2 py-1 rounded">
        <div className="w-2.5 h-2.5 rounded-full bg-odyssey-electric animate-pulse shadow-[0_0_8px_#06D6A0]" />
        <span className="text-[11px] font-bold text-odyssey-electric uppercase tracking-widest">Live Pulse</span>
      </div>

      <div className="flex-1 w-full overflow-hidden relative z-0">
        <motion.div
          animate={{ x: ["50%", "-100%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap flex gap-16"
        >
          {messages.map((m, i) => (
            <span key={i} className="text-sm text-white/80 font-mono flex items-center gap-3">
              <span className="text-xs text-muted-foreground">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
              {m}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const DEFAULT_FROM = '2025-01-01T00:00:00.000Z';

export function DashboardPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(new Date().toISOString());
  const [selectedSite, setSelectedSite] = useState<SiteId | 'ALL'>('ALL');
  const { data: dashboardData, loading, error, refetch } = useDashboard(from, to, selectedSite === 'ALL' ? undefined : selectedSite);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'events'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 5 minutes
  useAutoRefresh(refetch);

  const meta = dashboardData?.selectedSiteMetadata;
  const flowMetrics = dashboardData?.flow;
  const events = dashboardData?.recentEvents ?? [];

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // Reference stats
  const referenceStats = useMemo(() => ({
    accountCount: dashboardData?.accountCount || 0,
    purchaseTimes: dashboardData?.purchaseTimes || 0,
    purchaseUnit: dashboardData?.purchaseUnit || 0,
    purchaseMoney: dashboardData?.purchaseMoney || 0,
  }), [dashboardData]);

  return (
    <div className="space-y-4 animate-fade-in pb-12 overflow-x-hidden">

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            {selectedSite === 'ALL' ? 'Portfolio Overview' : `${selectedSite} Dashboard`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time energy management & microgrid performance</p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value as SiteId | 'ALL')}
            className="glass border-none rounded-lg px-4 py-2 text-sm font-semibold text-white bg-transparent focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
          >
            <option value="ALL" className="bg-odyssey-card text-white">All Sites (Portfolio)</option>
            {SITES.map(s => <option key={s} value={s} className="bg-odyssey-card text-white">{s} Site</option>)}
          </select>
          <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
          <button
            onClick={handleRefresh}
            className="p-2 lg:px-4 lg:py-2 rounded-lg hover:bg-white/10 transition-colors group flex items-center gap-2"
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground group-hover:text-white transition-all", (loading || isRefreshing) && "animate-spin text-odyssey-electric")} />
            <span className="hidden lg:block text-sm font-medium text-white/80 group-hover:text-white">Refresh</span>
          </button>
        </div>
      </div>

      <StatusTicker />

      <ReferenceStats stats={referenceStats} loading={loading} />

      {/* ── ERROR DISPLAY ───────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-4 text-red-500 shadow-lg animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Data Retrieval Error</h4>
            <p className="text-sm opacity-90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      {/* ── MAIN CHARTS CONTENT ─────────────────────────────────── */}
      <div className="flex flex-col gap-6 animate-fade-in">

        {/* ROW 1: Purchase Money Bar Chart */}
        <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-display text-odyssey-blue font-semibold">Purchase Money</h3>
          </div>
          <div className="h-[300px]">
            {loading ? <div className="h-full w-full shimmer-bg rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.charts?.purchaseMoney?.xData?.map((x: string, i: number) => ({ name: x, value: dashboardData.charts.purchaseMoney.yData[i] })) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E3050" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0B1521', borderColor: '#1E3050', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ROW 2: Hourly Success Line Chart & Abnormal Alarm Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <h3 className="text-lg font-display text-odyssey-blue font-semibold">Hourly Success Rate</h3>
            </div>
            <div className="h-[260px]">
              {loading ? <div className="h-full w-full shimmer-bg rounded" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.charts?.hourlySuccess?.xData?.map((x: string, i: number) => ({ name: x, value: dashboardData.charts.hourlySuccess.yData[i] })) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E3050" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0B1521', borderColor: '#1E3050', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <h3 className="text-lg font-display text-odyssey-blue font-semibold">Abnormal Alarm</h3>
            </div>
            <div className="h-[260px]">
              {loading ? <div className="h-full w-full shimmer-bg rounded" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={dashboardData?.charts?.abnormalAlarm?.xData?.map((x: string, i: number) => ({ name: x, value: dashboardData.charts.abnormalAlarm.yData[i] || 0 })).filter((d: any) => d.value > 0) || []}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={true}
                    >
                      {(dashboardData?.charts?.abnormalAlarm?.xData || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0B1521', borderColor: '#1E3050', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: Daily Consumption Bar Chart */}
        <div className="glass rounded-xl border border-odyssey-border p-6 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-display text-odyssey-blue font-semibold">Daily Consumption</h3>
          </div>
          <div className="h-[300px]">
            {loading ? <div className="h-full w-full shimmer-bg rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.charts?.dailyConsumption?.xData?.map((x: string, i: number) => ({ name: x, value: dashboardData.charts.dailyConsumption.yData[i] })) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E3050" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0B1521', borderColor: '#1E3050', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
