import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Edit2, Trash2, Upload, RefreshCw, Square } from 'lucide-react';
import { apiClient } from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { cn } from '../../lib/utils';

export function CustomerManagementPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [jumpPage, setJumpPage] = useState('1');
    const [filters, setFilters] = useState({ search: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { total: totalCount, data: results } = await apiClient.customer.read({
                pageNumber: page,
                pageSize: limit,
                searchTerm: filters.search || undefined
            });
            setData(results || []);
            setTotal(totalCount || 0);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [page]);
    useAutoRefresh(fetchData);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-center mt-2">
                <h1 className="text-2xl font-display font-bold text-white tracking-tight">Customer</h1>
            </div>

            <div className="glass p-3 rounded-xl border border-odyssey-border/50 flex flex-wrap items-center gap-3 shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search Term"
                        className="w-64 bg-black/20 border border-white/5 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-odyssey-blue transition-colors"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    />
                    <button onClick={fetchData} className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
                        <Search className="w-4 h-4" /> Search
                    </button>
                    <button onClick={() => { setFilters({ search: '' }); setTimeout(fetchData, 10); }} className="bg-[#1890ff] text-white text-sm py-2 px-4 rounded transition-all hover:bg-[#40a9ff] flex items-center gap-2 shadow-sm">
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
                    <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                        <thead className="bg-[#f0f2f5] text-[#333] font-semibold tracking-wider text-[11px] border-b border-gray-200">
                            <tr>
                                <th className="w-12 px-2 py-3 text-center border-r border-gray-200">
                                    <Square className="w-3.5 h-3.5 mx-auto text-gray-400 hover:text-odyssey-blue cursor-pointer" />
                                </th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold">Id</th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Name <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Phone <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Address <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">CertifiName <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">CertifiNo <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Remark <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Create Time <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold">Update Time</th>
                                <th className="px-4 py-3 border-r border-gray-200 text-center font-semibold text-[#1890ff] cursor-pointer">Station Id <Search className="w-3 h-3 inline ml-1 opacity-50" /></th>
                                <th className="px-4 py-3 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white text-[#333]">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse"><td colSpan={12} className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-full" /></td></tr>)
                            ) : data.length > 0 ? (
                                data.map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50/50 transition-colors group text-[11px]">
                                        <td className="px-2 py-3 text-center border-r border-gray-100">
                                            <Square className="w-3.5 h-3.5 mx-auto text-gray-300 hover:text-odyssey-blue cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.customerId || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100 uppercase">{row.customerName || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.phone || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100 uppercase">{row.address || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100 uppercase">{row.certifiName || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.certifiNo || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.remark || '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.createDate ? new Date(row.createDate).toLocaleString('sv').replace('T', ' ') : '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.updateDate ? new Date(row.updateDate).toLocaleString('sv').replace('T', ' ') : '-'}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{row.stationId || 'TUNGA'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button className="px-3 py-1 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-[11px] transition-colors shadow-sm">Edit</button>
                                                <button className="px-3 py-1 rounded bg-[#ff4d4f] hover:bg-[#ff7875] text-white text-[11px] transition-colors shadow-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (<tr><td colSpan={12} className="px-6 py-16 text-center text-muted-foreground italic text-sm">No customers found</td></tr>)}
                        </tbody>
                    </table>
                </div>

                {/* Exact UI Pagination */}
                <div className="flex items-center text-[13px] text-gray-500 bg-white py-3 px-4 border-t border-gray-200 gap-4">
                    <span>Total {total}</span>
                    <div className="flex items-center">
                        <select
                            value={limit}
                            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="border border-gray-300 rounded px-2 py-0.5 outline-none hover:border-[#1890ff] transition-colors"
                        >
                            <option value={20}>20/page</option>
                            <option value={50}>50/page</option>
                            <option value={100}>100/page</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:border-[#1890ff] hover:text-[#1890ff] disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors">
                            {'<'}
                        </button>

                        {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={cn("w-7 h-7 flex items-center justify-center border rounded transition-colors",
                                    p === page ? "bg-[#1890ff] text-white border-[#1890ff]" : "border-gray-300 hover:border-[#1890ff] hover:text-[#1890ff]"
                                )}
                            >
                                {p}
                            </button>
                        ))}

                        {totalPages > 6 && <span className="px-1 tracking-widest">...</span>}
                        {totalPages > 6 && (
                            <button
                                onClick={() => setPage(totalPages)}
                                className={cn("w-7 h-7 flex items-center justify-center border rounded transition-colors",
                                    totalPages === page ? "bg-[#1890ff] text-white border-[#1890ff]" : "border-gray-300 hover:border-[#1890ff] hover:text-[#1890ff]"
                                )}
                            >
                                {totalPages}
                            </button>
                        )}

                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:border-[#1890ff] hover:text-[#1890ff] disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors">
                            {'>'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                        <span>Go to</span>
                        <input
                            type="text"
                            className="w-10 h-7 border border-gray-300 rounded text-center outline-none hover:border-[#1890ff] focus:border-[#1890ff] transition-colors"
                            value={jumpPage}
                            onChange={(e) => setJumpPage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const p = parseInt(jumpPage);
                                    if (!isNaN(p) && p >= 1 && p <= totalPages) setPage(p);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
