// ============================================================
// /frontend/src/components/Dashboard/SiteBreakdown.tsx
// ============================================================
import { SITES, type SiteId, type SiteKPI } from '@common/types/odyssey';
import { formatCurrency, formatKwh, formatNumber, SITE_COLORS } from '../../lib/utils';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface SiteBreakdownProps {
  sites: SiteKPI[];
  loading?: boolean;
}

export function SiteBreakdown({ sites, loading }: SiteBreakdownProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl border border-odyssey-border p-6">
        <div className="h-5 w-40 shimmer-bg rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 shimmer-bg rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
      <div className="px-6 py-4 border-b border-odyssey-border">
        <h3 className="font-display font-semibold text-white">Site Performance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">All 5 sites — last 30 days</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-odyssey-border">
              {['Site', 'Revenue', 'Energy (kWh)', 'Tokens Sold', 'Meters', 'Tamper', 'Non-Purchase', 'Uptime'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-odyssey-border/50">
            {sites.map(site => {
              const color = SITE_COLORS[site.siteId];
              return (
                <tr key={site.siteId} className="hover:bg-odyssey-border/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-slow"
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <span className="font-mono text-xs text-white font-medium">{site.siteId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-odyssey-electric font-medium whitespace-nowrap">
                    {formatCurrency(site.totalRevenue)}
                  </td>
                  <td className="px-4 py-3.5 text-white whitespace-nowrap">
                    {formatKwh(site.totalEnergyKwh)}
                  </td>
                  <td className="px-4 py-3.5 text-white whitespace-nowrap">
                    {formatNumber(site.totalTokensSold, 0)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-odyssey-accent" />
                      <span className="text-white">{site.activeMeters}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {site.tamperAlerts > 0 ? (
                      <div className="flex items-center gap-1.5 text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-medium">{site.tamperAlerts}</span>
                      </div>
                    ) : (
                      <span className="text-odyssey-electric">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={site.longNonPurchaseCount > 10 ? 'text-amber-400' : 'text-muted-foreground'}>
                      {site.longNonPurchaseCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-odyssey-border rounded-full overflow-hidden w-16">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${site.gatewayUptime}%`,
                            backgroundColor: site.gatewayUptime > 95 ? '#06D6A0' : site.gatewayUptime > 80 ? '#FFB703' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {site.gatewayUptime}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
