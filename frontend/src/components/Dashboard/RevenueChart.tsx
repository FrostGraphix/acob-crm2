// ============================================================
// /frontend/src/components/Dashboard/RevenueChart.tsx
// ============================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { SITES, type SiteKPI } from '@common/types/odyssey';
import { SITE_COLORS, formatCurrency } from '../../lib/utils';

interface RevenueChartProps {
  sites: SiteKPI[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-odyssey-border p-3 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-odyssey-electric font-mono">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-muted-foreground mt-1">{payload[0]?.payload?.totalTokensSold} tokens sold</p>
    </div>
  );
};

export function RevenueChart({ sites, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl border border-odyssey-border p-6">
        <div className="h-5 w-36 shimmer-bg rounded mb-4" />
        <div className="h-64 shimmer-bg rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-odyssey-border p-6">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-white">Revenue by Site</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 30 days — token sales</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sites} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
          <XAxis
            dataKey="siteId"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,48,80,0.4)' }} />
          <Bar dataKey="totalRevenue" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {sites.map(site => (
              <Cell
                key={site.siteId}
                fill={SITE_COLORS[site.siteId]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
