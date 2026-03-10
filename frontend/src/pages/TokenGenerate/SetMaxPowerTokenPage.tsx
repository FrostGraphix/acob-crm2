import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Gauge } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

export function SetMaxPowerTokenPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ stationId: 'ALL', search: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/meters', {
        params: { siteId: filters.stationId === 'ALL' ? undefined : filters.stationId, search: filters.search || undefined }
      });
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Set Max Power Token</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate tokens to set load limits on meters</p>
      </div>

      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 flex flex-wrap items-end gap-4 shadow-lg">
        <div className="flex-1 min-w-[240px] space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Search</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-odyssey-electric transition-colors" />
            <input
              type="text"
              placeholder="Customer ID, Name or Meter SN..."
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-odyssey-electric/50 transition-all"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
        </div>
        <div className="w-full sm:w-48 space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Station</label>
          <select
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-odyssey-electric/50 appearance-none cursor-pointer"
            value={filters.stationId}
            onChange={(e) => setFilters({ ...filters, stationId: e.target.value })}
          >
            <option value="ALL">All Stations</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={fetchData} className="bg-odyssey-electric hover:bg-odyssey-electric/90 text-odyssey-card font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 h-[42px]">
          <Search className="w-4 h-4" /> Query
        </button>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 border-b border-white/5">Customer Id</th>
                <th className="px-6 py-4 border-b border-white/5">Customer Name</th>
                <th className="px-6 py-4 border-b border-white/5">Meter Id</th>
                <th className="px-6 py-4 border-b border-white/5">Meter Type</th>
                <th className="px-6 py-4 border-b border-white/5">Comm. Way</th>
                <th className="px-6 py-4 border-b border-white/5">Tariff Id</th>
                <th className="px-6 py-4 border-b border-white/5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-odyssey-electric">{row.customerId}</td>
                    <td className="px-6 py-4 font-semibold text-white">{row.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-odyssey-blue">{row.meterId}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.meterType || 'GPRS Meter'}</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">GPRS</span></td>
                    <td className="px-6 py-4 text-white">{row.tariffId}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-[11px] font-bold border border-blue-500/20 flex items-center gap-2 mx-auto">
                        <Gauge className="w-3 h-3" /> Set Limit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">No meters found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
