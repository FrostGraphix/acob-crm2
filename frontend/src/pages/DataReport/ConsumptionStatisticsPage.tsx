import React, { useState, useEffect } from 'react';
import { Search, BarChart3, Table2, RefreshCw, Download } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';

type ViewMode = 'data' | 'chart';

export function ConsumptionStatisticsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [filters, setFilters] = useState({
    stationId: 'ALL',
    search: '',
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/reports/consumption', {
        params: {
          siteId: filters.stationId === 'ALL' ? undefined : filters.stationId,
          from: filters.from,
          to: filters.to,
        }
      });
      // Flatten site-level arrays into a single list
      const raw = resp.data || [];
      const flat = Array.isArray(raw) ? raw.flatMap((entry: any) => Array.isArray(entry.data) ? entry.data.map((d: any) => ({ ...d, siteId: entry.siteId })) : [entry]) : [];
      setData(flat);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId, filters.from, filters.to]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Consumption Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyze meter consumption patterns and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl p-1 flex">
            <button onClick={() => setViewMode('data')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'data' ? "bg-odyssey-electric text-odyssey-card" : "text-muted-foreground hover:text-white")}>
              <Table2 className="w-3.5 h-3.5 inline-block mr-1.5" /> Data
            </button>
            <button onClick={() => setViewMode('chart')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'chart' ? "bg-odyssey-electric text-odyssey-card" : "text-muted-foreground hover:text-white")}>
              <BarChart3 className="w-3.5 h-3.5 inline-block mr-1.5" /> Chart
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass border-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4 text-odyssey-electric" /> Export
          </button>
          <button onClick={fetchData} className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors" disabled={loading}>
            <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin text-odyssey-electric")} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-lg">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Date Range</label>
          <DateRangePicker
            from={filters.from}
            to={filters.to}
            onFromChange={(from: string) => setFilters({ ...filters, from })}
            onToChange={(to: string) => setFilters({ ...filters, to })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Station</label>
          <select className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value })}>
            <option value="ALL">All Stations</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Search Meter/Customer</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-odyssey-electric transition-colors" />
            <input type="text" placeholder="Search..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
        </div>
        <div className="flex items-end">
          <button onClick={fetchData} className="w-full bg-odyssey-electric hover:bg-odyssey-electric/90 text-odyssey-card font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 h-[42px]"><Search className="w-4 h-4" /> Apply</button>
        </div>
      </div>

      {/* Data View */}
      {viewMode === 'data' ? (
        <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
              <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-4 border-b border-white/5">Meter Id</th>
                  <th className="px-4 py-4 border-b border-white/5">Customer Name</th>
                  <th className="px-4 py-4 border-b border-white/5">Site</th>
                  <th className="px-4 py-4 border-b border-white/5">Date</th>
                  <th className="px-4 py-4 border-b border-white/5">Total Energy (kWh)</th>
                  <th className="px-4 py-4 border-b border-white/5">Positive Active (kWh)</th>
                  <th className="px-4 py-4 border-b border-white/5">Reverse Active (kWh)</th>
                  <th className="px-4 py-4 border-b border-white/5">Max Demand (kW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/90">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
                ) : data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-mono text-odyssey-electric">{row.meterId || row.meterSN}</td>
                      <td className="px-4 py-4 font-semibold">{row.customerName || '-'}</td>
                      <td className="px-4 py-4"><span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">{row.siteId}</span></td>
                      <td className="px-4 py-4 text-muted-foreground">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-4 font-bold text-odyssey-electric">{(row.totalEnergy || row.positiveActiveEnergy || 0).toFixed(2)}</td>
                      <td className="px-4 py-4">{(row.positiveActiveEnergy || 0).toFixed(2)}</td>
                      <td className="px-4 py-4">{(row.reverseActiveEnergy || 0).toFixed(2)}</td>
                      <td className="px-4 py-4">{(row.maxDemand || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">No consumption data found for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Chart View */
        <div className="glass rounded-2xl border border-odyssey-border/50 p-8 shadow-xl min-h-[400px] flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
          ) : data.length > 0 ? (
            <div className="w-full space-y-6">
              <h3 className="text-sm font-bold text-white">Energy Consumption Overview</h3>
              <div className="space-y-3">
                {data.slice(0, 20).map((row, i) => {
                  const maxVal = Math.max(...data.slice(0, 20).map((d: any) => d.positiveActiveEnergy || d.totalEnergy || 1));
                  const val = row.positiveActiveEnergy || row.totalEnergy || 0;
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[10px] font-mono text-muted-foreground w-28 truncate">{row.meterId || row.meterSN}</span>
                      <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-odyssey-blue to-odyssey-electric rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-odyssey-electric w-20 text-right">{val.toFixed(1)} kWh</span>
                    </div>
                  );
                })}
              </div>
              {data.length > 20 && <p className="text-xs text-muted-foreground text-center">Showing top 20 of {data.length} records</p>}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No data available to chart</p>
          )}
        </div>
      )}
    </div>
  );
}
