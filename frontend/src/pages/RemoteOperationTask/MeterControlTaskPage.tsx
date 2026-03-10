import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';

export function MeterControlTaskPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    stationId: 'ALL', search: '',
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString()
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/operations/tasks/control', {
        params: { siteId: filters.stationId === 'ALL' ? undefined : filters.stationId, search: filters.search || undefined, from: filters.from, to: filters.to }
      });
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId, filters.from, filters.to]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Meter Control Task</h1>
        <p className="text-sm text-muted-foreground mt-1">Audit trail of all remote meter control operations</p>
      </div>

      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-lg">
        <DateRangePicker from={filters.from} to={filters.to} onFromChange={(v: string) => setFilters({ ...filters, from: v })} onToChange={(v: string) => setFilters({ ...filters, to: v })} />
        <select className="bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value })}>
          <option value="ALL">All Stations</option>
          {SITES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} onKeyDown={e => e.key === 'Enter' && fetchData()} />
        </div>
        <button onClick={fetchData} className="bg-odyssey-blue text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 h-[42px]"><Search className="w-4 h-4" /> Query</button>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-4"><input type="checkbox" readOnly /></th>
                <th className="px-4 py-4">Customer Id</th>
                <th className="px-4 py-4">Customer Name</th>
                <th className="px-4 py-4">Meter Id</th>
                <th className="px-4 py-4">Control Type</th>
                <th className="px-4 py-4">Station Id</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4"><input type="checkbox" readOnly /></td>
                    <td className="px-4 py-4">{row.customerId}</td>
                    <td className="px-4 py-4 font-semibold">{row.customerName}</td>
                    <td className="px-4 py-4 font-mono text-odyssey-electric">{row.meterId}</td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        row.controlType === 'DISCONNECT' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                      )}>{row.controlType || 'CONNECT'}</span>
                    </td>
                    <td className="px-4 py-4">{row.stationId}</td>
                    <td className="px-4 py-4 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[10px] border", row.status === 'FAILED' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20")}>{row.status || 'FINISHED'}</span></td>
                    <td className="px-4 py-4 italic text-muted-foreground">{row.remark || '-'}</td>
                  </tr>
                ))
              ) : (<tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">No control tasks found</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
