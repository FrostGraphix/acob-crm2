import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, RefreshCw, Calendar, TrendingUp, Sun, Moon, Zap, Activity } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsApi, type DailyConsumptionAnalytics, type MeterConsumptionAnalytics } from '../../services/management-api';
import { SITES, type SiteId } from '@common/types/odyssey';
import { Select } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { formatCurrency, formatKwh } from '../../lib/utils';

export function ConsumptionAnalytics({ meterSN }: { meterSN?: string }) {
    const [dailyData, setDailyData] = useState<DailyConsumptionAnalytics[]>([]);
    const [meterData, setMeterData] = useState<MeterConsumptionAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const siteParam = filterSite === 'ALL' ? undefined : filterSite;

            const [dailyRes, meterRes] = await Promise.all([
                analyticsApi.getConsumption(siteParam, meterSN),
                // If we are showing a specific meter's analytics only, we skip the large meter list
                meterSN ? Promise.resolve([]) : analyticsApi.getMeterConsumption(siteParam)
            ]);

            setDailyData(dailyRes);
            setMeterData(meterRes);
        } catch {
            setDailyData([]);
            setMeterData([]);
        } finally {
            setLoading(false);
        }
    }, [filterSite, meterSN]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => {
        const totalKwh = dailyData.reduce((acc, d) => acc + d.totalKwh, 0);
        const dayKwh = dailyData.reduce((acc, d) => acc + d.dayKwh, 0);
        const nightKwh = dailyData.reduce((acc, d) => acc + d.nightKwh, 0);
        const totalRev = dailyData.reduce((acc, d) => acc + d.totalRevenue, 0);

        return {
            totalKwh,
            dayKwh,
            nightKwh,
            totalRev,
            dayPct: totalKwh > 0 ? (dayKwh / totalKwh) * 100 : 0,
            nightPct: totalKwh > 0 ? (nightKwh / totalKwh) * 100 : 0,
        };
    }, [dailyData]);

    // Chart Tooltip formatting
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass p-3 border border-odyssey-border rounded-lg shadow-xl text-xs space-y-1 z-50">
                    <p className="font-bold text-white mb-2 pb-1 border-b border-odyssey-border/50">{label}</p>
                    <div className="flex justify-between gap-4">
                        <span className="flex items-center gap-1 text-amber-400"><Sun className="w-3 h-3" /> Day (06-18h):</span>
                        <span className="font-mono text-white">{formatKwh(payload[0]?.value)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="flex items-center gap-1 text-blue-400"><Moon className="w-3 h-3" /> Night (18-06h):</span>
                        <span className="font-mono text-white">{formatKwh(payload[1]?.value)}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-odyssey-border/50">
                        <span className="font-bold text-muted-foreground">Total:</span>
                        <span className="font-mono font-bold text-odyssey-electric">{formatKwh((payload[0]?.value || 0) + (payload[1]?.value || 0))}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {!meterSN && (
                <div className="flex items-center justify-between gap-3">
                    <Select value={filterSite} onChange={e => setFilterSite(e.target.value as any)} className="w-40 py-2 text-xs">
                        <option value="ALL">All Sites</option>
                        {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <button onClick={load} className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all">
                        <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            )}

            {/* KPI Highlight */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Energy', value: formatKwh(stats.totalKwh), icon: Zap, color: 'text-odyssey-electric' },
                    { label: 'Day Usage (6am-6pm)', value: `${formatKwh(stats.dayKwh)} (${stats.dayPct.toFixed(1)}%)`, icon: Sun, color: 'text-amber-400' },
                    { label: 'Night Usage (6pm-6am)', value: `${formatKwh(stats.nightKwh)} (${stats.nightPct.toFixed(1)}%)`, icon: Moon, color: 'text-blue-400' },
                    { label: 'Total Revenue', value: formatCurrency(stats.totalRev), icon: TrendingUp, color: 'text-green-400' },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="glass rounded-xl border border-odyssey-border p-5">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{s.label}</p>
                                <Icon className={`w-4 h-4 ${s.color}`} />
                            </div>
                            <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="glass rounded-xl border border-odyssey-border p-6 relative">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                    <BarChart3 className="w-4 h-4 text-odyssey-electric" /> Day vs Night Energy Consumption Trends
                </h3>
                {loading ? (
                    <div className="w-full h-[300px] shimmer-bg rounded-lg" />
                ) : dailyData.length === 0 ? (
                    <div className="w-full h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                        <Activity className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">No historical consumption data found.</p>
                    </div>
                ) : (
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDay" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Area type="monotone" name="Day kWh" dataKey="dayKwh" stroke="#fbbf24" strokeWidth={2} fill="url(#colorDay)" />
                                <Area type="monotone" name="Night kWh" dataKey="nightKwh" stroke="#60a5fa" strokeWidth={2} fill="url(#colorNight)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Meter List Table - only if we aren't viewing a single meter */}
            {!meterSN && !loading && meterData.length > 0 && (
                <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
                    <div className="p-4 border-b border-odyssey-border bg-odyssey-border/20 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-muted-foreground" /> Top Consumers
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-xs text-left">
                            <thead className="sticky top-0 bg-[#0f172a] shadow-sm z-10">
                                <tr className="border-b border-odyssey-border/50 uppercase tracking-wider text-[10px] text-muted-foreground font-bold">
                                    <th className="px-4 py-3">Meter SN</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Site</th>
                                    <th className="px-4 py-3 text-right">Day kWh</th>
                                    <th className="px-4 py-3 text-right">Night kWh</th>
                                    <th className="px-4 py-3 text-right">Total kWh</th>
                                    <th className="px-4 py-3 text-right">% Day</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-odyssey-border/30">
                                {meterData.map(m => {
                                    const dayPct = m.totalKwh > 0 ? (m.dayKwh / m.totalKwh) * 100 : 0;
                                    return (
                                        <tr key={m.meterSN} className="hover:bg-odyssey-border/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-odyssey-accent">{m.meterSN}</td>
                                            <td className="px-4 py-3 text-white font-medium">{m.customerName}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{m.siteId}</td>
                                            <td className="px-4 py-3 text-right text-amber-400 font-mono">{formatKwh(m.dayKwh)}</td>
                                            <td className="px-4 py-3 text-right text-blue-400 font-mono">{formatKwh(m.nightKwh)}</td>
                                            <td className="px-4 py-3 text-right text-odyssey-electric font-bold font-mono">{formatKwh(m.totalKwh)}</td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-[10px] text-muted-foreground">{dayPct.toFixed(0)}%</span>
                                                    <div className="w-12 h-1.5 bg-blue-500/30 rounded overflow-hidden flex">
                                                        <div className="h-full bg-amber-400" style={{ width: `${dayPct}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
