import React, { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, X } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

export function MeterReadingPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ stationId: 'ALL', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddTask = (meter: any) => {
    setSelectedMeter(meter);
    setModalOpen(true);
  };

  const handleSubmitTask = async () => {
    if (!selectedMeter) return;
    setSubmitting(true);
    try {
      await apiClient.post('/operations/reading-task', {
        meterSN: selectedMeter.meterId,
        siteId: selectedMeter.siteId || filters.stationId,
        operatorId: 'system',
      });
      setModalOpen(false);
      setSelectedMeter(null);
    } catch (err) {
      console.error('Failed to create reading task', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Meter Reading</h1>
          <p className="text-sm text-muted-foreground mt-1">Initiate remote meter reading operations</p>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors" disabled={loading}>
          <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin text-odyssey-electric")} />
        </button>
      </div>

      <div className="glass p-5 rounded-2xl border border-odyssey-border/50 flex flex-wrap items-end gap-4 shadow-lg">
        <div className="w-48 space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Station</label>
          <select className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value })}>
            <option value="ALL">All Stations</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[240px] space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Search</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Meter ID, Customer Name..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} onKeyDown={e => e.key === 'Enter' && fetchData()} />
          </div>
        </div>
        <button onClick={fetchData} className="bg-odyssey-electric text-odyssey-card font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 h-[42px]"><Search className="w-4 h-4" /> Query</button>
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
                      <button
                        onClick={() => handleAddTask(row)}
                        className="px-3 py-1.5 rounded-lg bg-odyssey-blue/10 text-odyssey-blue hover:bg-odyssey-blue hover:text-white transition-all text-[11px] font-bold border border-odyssey-blue/20 flex items-center gap-2 mx-auto"
                      >
                        <BookOpen className="w-3 h-3" /> Add Task
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

      {/* Add Reading Task Modal */}
      {modalOpen && selectedMeter && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl border border-odyssey-border/50 p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-display font-bold text-white">Confirm Meter Reading Task</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="text-white font-mono">{selectedMeter.customerId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Customer Name</span>
                <span className="text-white font-semibold">{selectedMeter.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Meter ID</span>
                <span className="text-odyssey-electric font-mono">{selectedMeter.meterId}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground text-sm font-semibold hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleSubmitTask} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-odyssey-blue text-white text-sm font-bold hover:bg-odyssey-blue/90 transition-all disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
