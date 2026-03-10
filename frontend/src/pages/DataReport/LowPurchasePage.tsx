import React, { useState, useEffect } from 'react';
import { Search, Info, Download } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

export function LowPurchasePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ stationId: 'ALL', search: '', threshold: 10 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/reports/low-purchase', {
        params: { siteId: filters.stationId === 'ALL' ? undefined : filters.stationId, search: filters.search || undefined, threshold: filters.threshold }
      });
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Low Purchase</h1>
          <p className="text-sm text-muted-foreground mt-1">Identification of customers with low purchase amounts or frequency</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm font-semibold text-white hover:bg-white/10 transition-all">
          <Download className="w-4 h-4 text-odyssey-electric" /> Export
        </button>
      </div>

      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 flex flex-wrap items-end gap-4">
        <div className="w-32 space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Threshold</label>
          <input type="number" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none" value={filters.threshold} onChange={e => setFilters({ ...filters, threshold: parseInt(e.target.value) })} />
        </div>
        <div className="w-48 space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Station</label>
          <select className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value })}>
            <option value="ALL">All Stations</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Search</label>
          <input type="text" placeholder="Meter/Customer..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <button onClick={fetchData} className="bg-odyssey-electric text-odyssey-card font-bold py-2.5 px-8 rounded-xl h-[42px] font-bold"><Search className="w-4 h-4" /> Query</button>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-4"><input type="checkbox" readOnly /></th>
                <th className="px-4 py-4">Customer Id</th>
                <th className="px-4 py-4">Customer Name</th>
                <th className="px-4 py-4">Meter Id</th>
                <th className="px-4 py-4">Tariff Id</th>
                <th className="px-4 py-4">Total Unit</th>
                <th className="px-4 py-4">Total Paid</th>
                <th className="px-4 py-4">Times</th>
                <th className="px-4 py-4">Last Purchase Unit</th>
                <th className="px-4 py-4">Last Purchase Date</th>
                <th className="px-4 py-4">Station Id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={11} className="px-4 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4"><input type="checkbox" readOnly /></td>
                    <td className="px-4 py-4">{row.customerId}</td>
                    <td className="px-4 py-4 font-semibold">{row.customerName}</td>
                    <td className="px-4 py-4 font-mono text-odyssey-electric">{row.meterId}</td>
                    <td className="px-4 py-4">{row.tariffId}</td>
                    <td className="px-4 py-4">{row.totalUnit} kWh</td>
                    <td className="px-4 py-4">₦{row.totalPaid?.toLocaleString()}</td>
                    <td className="px-4 py-4">{row.purchaseTimes || row.times || 0}</td>
                    <td className="px-4 py-4">{row.lastPurchaseUnit} kWh</td>
                    <td className="px-4 py-4">{row.lastPurchaseDate ? new Date(row.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-4">{row.stationId}</td>
                  </tr>
                ))
              ) : (<tr><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground italic">No low purchase records found</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
