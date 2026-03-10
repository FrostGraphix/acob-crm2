import React, { useState, useEffect } from 'react';
import { Search, Printer, XCircle, RefreshCw, Calendar, Download } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';

export function CreditTokenRecordPage() {
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
      const resp = await apiClient.token.readCreditRecords({
        stationId: filters.stationId === 'ALL' ? undefined : filters.stationId,
        searchTerm: filters.search || undefined,
        createDateRange: [filters.from, filters.to],
        pageNumber: 1,
        pageSize: 1000
      });
      setData(resp.data || []);
    } catch (err) {
      console.error('Failed to fetch credit records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.stationId, filters.from, filters.to]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Credit Token Record</h1>
          <p className="text-sm text-muted-foreground mt-1">History of all credit token recharge transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass border-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4 text-odyssey-electric" />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin text-odyssey-electric")} />
          </button>
        </div>
      </div>

      {/* --- Filter Section --- */}
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
          <select
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-odyssey-electric/50 appearance-none cursor-pointer"
            value={filters.stationId}
            onChange={(e) => setFilters({ ...filters, stationId: e.target.value })}
          >
            <option value="ALL">All Stations</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Search Meter/Customer</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-odyssey-electric transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-odyssey-electric/50 transition-all"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
        </div>

        <div className="flex items-end shadow-[0_0_15px_-5px_#06D6A0]">
          <button
            onClick={fetchData}
            className="w-full bg-odyssey-electric hover:bg-odyssey-electric/90 text-odyssey-card font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 h-[42px]"
          >
            <Search className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[1600px]">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-4 border-b border-white/5">Receipt Id</th>
                <th className="px-4 py-4 border-b border-white/5">Customer Id</th>
                <th className="px-4 py-4 border-b border-white/5">Customer Name</th>
                <th className="px-4 py-4 border-b border-white/5">Meter Id</th>
                <th className="px-4 py-4 border-b border-white/5">Meter Type</th>
                <th className="px-4 py-4 border-b border-white/5">Tariff Id</th>
                <th className="px-4 py-4 border-b border-white/5">VAT Charge</th>
                <th className="px-4 py-4 border-b border-white/5">Total Unit</th>
                <th className="px-4 py-4 border-b border-white/5">Total Paid</th>
                <th className="px-4 py-4 border-b border-white/5">Token</th>
                <th className="px-4 py-4 border-b border-white/5">Vend</th>
                <th className="px-4 py-4 border-b border-white/5 text-center">Time</th>
                <th className="px-4 py-4 border-b border-white/5">Remark</th>
                <th className="px-4 py-4 border-b border-white/5">Station</th>
                <th className="px-4 py-4 border-b border-white/5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 15 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-white/5 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 font-mono text-odyssey-blue">{row.receiptId || row.ReceiptId}</td>
                    <td className="px-4 py-4">{row.customerId || row.CustomerId}</td>
                    <td className="px-4 py-4 font-semibold">{row.customerName || row.CustomerName}</td>
                    <td className="px-4 py-4 font-mono text-odyssey-electric">{row.meterId || row.MeterId}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.meterType || row.MeterType || 'GPRS'}</td>
                    <td className="px-4 py-4">{row.tariffId || row.TariffId}</td>
                    <td className="px-4 py-4">₦{(row.vatCharge || row.VATCharge || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-bold text-odyssey-electric">{row.totalUnit || row.TotalUnit} kWh</td>
                    <td className="px-4 py-4 font-bold">₦{(row.totalPaid || row.TotalPaid || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-mono text-[10px] break-all max-w-[120px]">{row.token || row.Token}</td>
                    <td className="px-4 py-4">{row.vend || row.Vend || 'Direct'}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground whitespace-nowrap">
                      {new Date(row.time || row.Time || row.createTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 italic text-muted-foreground max-w-[100px] truncate">{row.remark || row.Remark || '-'}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">{row.stationId || row.StationId}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:bg-odyssey-blue hover:text-white transition-all shadow-sm" title="Print Receipt">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Cancel Transaction">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-muted-foreground italic">No recharge records found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

