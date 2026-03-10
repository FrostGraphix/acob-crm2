import React, { useState, useEffect } from 'react';
import { Search, Printer, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { DateRangePicker } from '../../components/ui/DateRangePicker';

export function ClearCreditTokenRecordPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    stationId: 'ALL',
    search: '',
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/tokens/records/clear-credit', {
        params: { siteId: filters.stationId === 'ALL' ? undefined : filters.stationId, search: filters.search || undefined, from: filters.from, to: filters.to }
      });
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId, filters.from, filters.to]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Clear Credit Token Record</h1>
        <p className="text-sm text-muted-foreground mt-1">History of credit-clearing token operations</p>
      </div>

      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-lg">
        <DateRangePicker
          from={filters.from}
          to={filters.to}
          onFromChange={(from: string) => setFilters({ ...filters, from })}
          onToChange={(to: string) => setFilters({ ...filters, to })}
        />
        <select className="bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value })}>
          <option value="ALL">All Stations</option>
          {SITES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="text" placeholder="Search..." className="bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        <button onClick={fetchData} className="bg-odyssey-electric text-odyssey-card font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"><Search className="w-4 h-4" /> Query</button>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 border-b border-white/5">Receipt Id</th>
                <th className="px-6 py-4 border-b border-white/5">Customer Id</th>
                <th className="px-6 py-4 border-b border-white/5">Customer Name</th>
                <th className="px-6 py-4 border-b border-white/5">Meter Id</th>
                <th className="px-6 py-4 border-b border-white/5">Token</th>
                <th className="px-6 py-4 border-b border-white/5">Create Time</th>
                <th className="px-6 py-4 border-b border-white/5">Station</th>
                <th className="px-6 py-4 border-b border-white/5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={8} className="px-6 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-odyssey-blue">{row.receiptId || row.ReceiptId}</td>
                    <td className="px-6 py-4">{row.customerId || row.CustomerId}</td>
                    <td className="px-6 py-4 font-semibold">{row.customerName || row.CustomerName}</td>
                    <td className="px-6 py-4 font-mono text-odyssey-electric">{row.meterId || row.MeterId}</td>
                    <td className="px-6 py-4 font-mono text-[10px] break-all max-w-[150px]">{row.token || row.Token}</td>
                    <td className="px-6 py-4">{new Date(row.time || row.createTime).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">{row.stationId || row.StationId}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:bg-odyssey-blue hover:text-white transition-all"><Printer className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
