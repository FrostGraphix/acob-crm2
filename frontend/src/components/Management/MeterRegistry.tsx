import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cpu, RefreshCw, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Activity, TrendingUp, CalendarClock, Sun, Moon, AlertTriangle } from 'lucide-react';
import { meterApi, statsApi, type MeterStats } from '../../services/management-api';
import { SITES, type SiteId } from '@common/types/odyssey';
import { SITE_COLORS } from '../../lib/utils';
import { Select } from '../ui/Modal';

const PAGE_SIZE = 20;

type SortKey = 'meterSN' | 'siteId' | 'customerName' | 'totalRevenue' | 'totalKwh' | 'transactionCount' | 'lastSeen' | 'status';
type SortDir = 'asc' | 'desc';

function SortHeader({ label, sortKey, currentSort, currentDir, onSort }: { label: string; sortKey: SortKey; currentSort: SortKey; currentDir: SortDir; onSort: (k: SortKey) => void }) {
    const isActive = currentSort === sortKey;
    return (
        <th
            onClick={() => onSort(sortKey)}
            className="text-left px-4 py-3 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors select-none"
        >
            <span className="flex items-center gap-1">
                {label}
                {isActive ? (currentDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronDown className="w-3 h-3 opacity-20" />}
            </span>
        </th>
    );
}

const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export function MeterRegistry() {
    const [meters, setMeters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [expandedMeter, setExpandedMeter] = useState<string | null>(null);
    const [meterDetails, setMeterDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await meterApi.list(filterSite === 'ALL' ? undefined : filterSite);
            setMeters(res);
        } catch { setMeters([]); }
        finally { setLoading(false); }
    }, [filterSite]);

    useEffect(() => { load(); setPage(1); }, [load]);

    // Search filter
    const filtered = useMemo(() => {
        if (!search) return meters;
        const q = search.toLowerCase();
        return meters.filter(m =>
            m.meterSN?.toLowerCase().includes(q) ||
            m.customerName?.toLowerCase().includes(q) ||
            m.accountNo?.toLowerCase().includes(q)
        );
    }, [meters, search]);

    // Sort
    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortKey) {
                case 'meterSN': aVal = a.meterSN ?? ''; bVal = b.meterSN ?? ''; break;
                case 'siteId': aVal = a.siteId ?? ''; bVal = b.siteId ?? ''; break;
                case 'customerName': aVal = (a.customerName ?? '').toLowerCase(); bVal = (b.customerName ?? '').toLowerCase(); break;
                case 'totalRevenue': aVal = a.totalRevenue ?? 0; bVal = b.totalRevenue ?? 0; break;
                case 'totalKwh': aVal = a.totalKwh ?? 0; bVal = b.totalKwh ?? 0; break;
                case 'transactionCount': aVal = a.transactionCount ?? 0; bVal = b.transactionCount ?? 0; break;
                case 'lastSeen': aVal = a.lastSeen ?? ''; bVal = b.lastSeen ?? ''; break;
                case 'status': aVal = a.status ?? ''; bVal = b.status ?? ''; break;
                default: aVal = 0; bVal = 0;
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortKey, sortDir]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'meterSN' || key === 'siteId' || key === 'customerName' || key === 'status' ? 'asc' : 'desc'); }
        setPage(1);
    }

    async function toggleExpand(meterSN: string) {
        if (expandedMeter === meterSN) { setExpandedMeter(null); return; }
        setExpandedMeter(meterSN);
        setDetailsLoading(true);
        try {
            const details = await meterApi.getDetails(meterSN);
            setMeterDetails(details);
        } catch { setMeterDetails(null); }
        finally { setDetailsLoading(false); }
    }

    // Statistics from dedicated stats endpoint
    const [stats, setStats] = useState<MeterStats | null>(null);
    useEffect(() => {
        statsApi.getMeterStats(filterSite === 'ALL' ? undefined : filterSite)
            .then(setStats)
            .catch(() => setStats(null));
    }, [filterSite]);

    return (
        <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total Meters', value: (stats?.totalMeters ?? 0).toLocaleString(), icon: Cpu, color: 'text-blue-400' },
                    { label: 'Active Meters', value: (stats?.activeMeters ?? 0).toLocaleString(), icon: Activity, color: 'text-odyssey-electric' },
                    { label: 'Inactive Meters', value: (stats?.inactiveMeters ?? 0).toLocaleString(), icon: AlertTriangle, color: 'text-amber-400' },
                    { label: 'Total Consumption', value: `${(stats?.totalKwh ?? 0).toFixed(1)} kWh`, icon: Zap, color: 'text-purple-400' },
                    { label: 'Day Consumption', value: `${(stats?.dayKwh ?? 0).toFixed(1)} kWh`, icon: Sun, color: 'text-yellow-400' },
                    { label: 'Night Consumption', value: `${(stats?.nightKwh ?? 0).toFixed(1)} kWh`, icon: Moon, color: 'text-indigo-400' },
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glass rounded-xl border border-odyssey-border p-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                                {s.label}
                            </div>
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Select value={filterSite} onChange={e => { setFilterSite(e.target.value as any); setPage(1); }} className="w-40 py-2 text-xs">
                        <option value="ALL">All Sites</option>
                        {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            placeholder="Search meter SN, customer, account..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 w-64 py-2 px-3 text-xs bg-odyssey-deep border border-odyssey-border rounded-lg text-white focus:border-odyssey-accent focus:outline-none"
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{filtered.length} meter{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={load} className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all">
                    <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <Cpu className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No meters found</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-odyssey-border">
                                    <SortHeader label="Meter SN" sortKey="meterSN" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Site" sortKey="siteId" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Customer" sortKey="customerName" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Revenue" sortKey="totalRevenue" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Energy" sortKey="totalKwh" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Txns" sortKey="transactionCount" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Last Activity" sortKey="lastSeen" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                    <SortHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-odyssey-border/40">
                                {paginated.map((m: any) => {
                                    const color = SITE_COLORS[m.siteId] ?? '#64748b';
                                    const isExpanded = expandedMeter === m.meterSN;
                                    const daysAgo = m.lastSeen ? Math.floor((Date.now() - new Date(m.lastSeen).getTime()) / 86400000) : null;
                                    const recentLabel = daysAgo !== null ? (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`) : '—';
                                    return (
                                        <>
                                            <tr key={m.meterSN} onClick={() => toggleExpand(m.meterSN)} className="hover:bg-odyssey-border/20 transition-colors cursor-pointer">
                                                <td className="px-4 py-3.5 font-mono text-odyssey-accent font-medium">{m.meterSN}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className="px-2 py-0.5 rounded font-mono font-medium" style={{ backgroundColor: `${color}18`, color }}>
                                                        {m.siteId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-white font-medium">{m.customerName}</td>
                                                <td className="px-4 py-3.5 text-odyssey-electric font-medium">{fmt.format(m.totalRevenue ?? 0)}</td>
                                                <td className="px-4 py-3.5 text-blue-400">{(m.totalKwh ?? 0).toFixed(1)} kWh</td>
                                                <td className="px-4 py-3.5 text-muted-foreground text-center">{m.transactionCount ?? 0}</td>
                                                <td className="px-4 py-3.5 text-muted-foreground">{recentLabel}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${m.status === 'ACTIVE'
                                                        ? 'text-odyssey-electric bg-odyssey-electric/10 border-odyssey-electric/30'
                                                        : 'text-muted-foreground bg-odyssey-border/30 border-odyssey-border'
                                                        }`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${m.meterSN}-expand`}>
                                                    <td colSpan={8} className="p-4 bg-odyssey-deep/50">
                                                        {detailsLoading ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground text-xs"><RefreshCw className="w-3 h-3 animate-spin" /> Loading details...</div>
                                                        ) : meterDetails ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Consumption Timeline */}
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-400" /> Monthly Consumption</h4>
                                                                    <div className="space-y-1.5">
                                                                        {(meterDetails.consumption ?? []).slice(-6).map((c: any) => (
                                                                            <div key={c.month} className="flex items-center gap-3 text-xs">
                                                                                <span className="text-muted-foreground w-16 font-mono">{c.month}</span>
                                                                                <div className="flex-1 h-4 bg-odyssey-border/30 rounded overflow-hidden">
                                                                                    <div className="h-full bg-gradient-to-r from-odyssey-accent to-odyssey-electric rounded"
                                                                                        style={{ width: `${Math.min(100, (c.totalKwh / Math.max(1, ...(meterDetails.consumption ?? []).map((x: any) => x.totalKwh))) * 100)}%` }} />
                                                                                </div>
                                                                                <span className="text-blue-400 w-16 text-right">{c.totalKwh.toFixed(1)} kWh</span>
                                                                                <span className="text-odyssey-electric w-16 text-right">{fmt.format(c.totalRevenue)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                {/* Recent Purchases */}
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5 text-purple-400" /> Recent Purchases ({meterDetails.transactions?.length ?? 0} total)</h4>
                                                                    <div className="space-y-1">
                                                                        {(meterDetails.transactions ?? []).slice(0, 8).map((tx: any, i: number) => (
                                                                            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-odyssey-border/20">
                                                                                <div className="flex items-center gap-2">
                                                                                    <TrendingUp className="w-3 h-3 text-odyssey-electric" />
                                                                                    <span className="text-odyssey-electric font-medium">{fmt.format(tx.amount)}</span>
                                                                                    <span className="text-blue-400">{tx.kwh?.toFixed(1)} kWh</span>
                                                                                </div>
                                                                                <span className="text-muted-foreground font-mono text-[10px]">{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : ''}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : <p className="text-xs text-muted-foreground">No details available</p>}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-odyssey-border">
                        <span className="text-xs text-muted-foreground">
                            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /><ChevronLeft className="w-3.5 h-3.5 -ml-2" />
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p: number;
                                if (totalPages <= 5) p = i + 1;
                                else if (page <= 3) p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-odyssey-accent text-white' : 'text-muted-foreground hover:bg-odyssey-border/60'}`}
                                    >{p}</button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5" /><ChevronRight className="w-3.5 h-3.5 -ml-2" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
