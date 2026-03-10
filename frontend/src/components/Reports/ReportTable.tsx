// ============================================================
// /frontend/src/components/Reports/ReportTable.tsx
// Generic report table — handles site-grouped data + CSV export
// ============================================================
import { useState, useMemo } from 'react';
import { Download, AlertTriangle, FileBarChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { SITE_COLORS } from '../../lib/utils';

interface Column { key: string; label: string; render?: (val: any, row: any) => React.ReactNode; }

interface SiteGroup { siteId: string; data: any[]; }

interface ReportTableProps {
  groups: SiteGroup[];
  columns: Column[];
  loading?: boolean;
  emptyMessage?: string;
  csvUrl?: string;
  title?: string;
  total?: number;
}

export function ReportTable({ groups, columns, loading, emptyMessage, csvUrl, title, total }: ReportTableProps) {
  const allRows = useMemo(() => groups.flatMap(g => g.data.map(d => ({ ...d, _siteId: g.siteId }))), [groups]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.max(1, Math.ceil(allRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allRows.slice(start, start + itemsPerPage);
  }, [allRows, currentPage]);

  if (loading) {
    return (
      <div className="glass rounded-xl border border-odyssey-border p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
      {(title || csvUrl) && (
        <div className="px-5 py-3.5 border-b border-odyssey-border flex items-center justify-between">
          <div>
            {title && <p className="text-sm font-medium text-white">{title}</p>}
            {total !== undefined && <p className="text-xs text-muted-foreground mt-0.5">{total} records</p>}
          </div>
          {csvUrl && (
            <a
              href={csvUrl}
              download
              className="flex items-center gap-1.5 text-xs text-odyssey-accent hover:text-odyssey-electric transition-colors px-3 py-1.5 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        {allRows.length === 0 ? (
          <div className="py-14 text-center">
            <FileBarChart className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{emptyMessage ?? 'No data for this period'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-odyssey-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium uppercase tracking-wider">Site</th>
                {columns.map(col => (
                  <th key={col.key} className="text-left px-4 py-3 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-odyssey-border/40">
              {paginatedRows.map((row, i) => {
                const color = SITE_COLORS[row._siteId] ?? '#64748b';
                return (
                  <tr key={i} className="hover:bg-odyssey-border/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${color}18`, color }}>
                        {row._siteId}
                      </span>
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-white">
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && allRows.length > 0 && (
        <div className="px-5 py-3 border-t border-odyssey-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allRows.length)} of {allRows.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
