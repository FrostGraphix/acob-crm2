import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Edit2, Trash2, Upload, RefreshCw, Square } from 'lucide-react';
import { apiClient } from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

export function MeterManagementPage() {
  const [loading, setLoading] = useState(false);
  const MAX_DASHBOARD_PAGES = 5;
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ stationId: 'ALL', search: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: results } = await apiClient.account.read({
        stationId: filters.stationId === 'ALL' ? undefined : filters.stationId,
        searchTerm: filters.search || undefined,
        pageNumber: 1,
        pageSize: 1000, // Load many for now as per previous functional parity
      });
      setData(results || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.stationId]);
  useAutoRefresh(fetchData);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center mt-2">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Account</h1>
      </div>

      <div className="glass p-3 rounded-xl border border-odyssey-border/50 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search Term"
            className="w-64 bg-black/20 border border-white/5 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-odyssey-blue transition-colors"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
          />
          <button onClick={fetchData} className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => { setFilters({ stationId: 'ALL', search: '' }); setTimeout(fetchData, 10); }} className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>

          <button className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm ml-2">
            <Edit2 className="w-3.5 h-3.5" /> Add
          </button>
          <button className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="bg-[#ff4d4f] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#ff7875] flex items-center gap-2 shadow-sm">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="w-12 px-6 py-4 text-center">
                  <Square className="w-4 h-4 mx-auto text-muted-foreground/50 hover:text-white cursor-pointer" />
                </th>
                <th className="px-6 py-4">Customer Id</th>
                <th className="px-6 py-4">Meter Id</th>
                <th className="px-6 py-4">Tariff Id</th>
                <th className="px-6 py-4">Communication Way</th>
                <th className="px-6 py-4">CT Ratio</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-6 py-5"><div className="h-4 bg-white/5 rounded w-full" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <Square className="w-4 h-4 mx-auto text-muted-foreground/30 hover:text-white cursor-pointer" />
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{row.customerId || '-'}</td>
                    <td className="px-6 py-4 font-mono text-odyssey-electric">{row.meterId || '-'}</td>
                    <td className="px-6 py-4">{row.tariffId || '-'}</td>
                    <td className="px-6 py-4">{row.communicationWay === 0 ? 'GPRS' : 'LoraWan'}</td>
                    <td className="px-6 py-4 font-mono">{row.ctRatio || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="px-3 py-1.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs transition-colors shadow-sm">Edit</button>
                        <button className="px-3 py-1.5 rounded bg-[#ff4d4f] hover:bg-[#ff7875] text-white text-xs transition-colors shadow-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan={7} className="px-6 py-16 text-center text-muted-foreground italic text-sm">No accounts found across registered sites</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
