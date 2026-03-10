// ============================================================
// /frontend/src/components/Dashboard/EnergyChart.tsx
// ============================================================
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { SITE_COLORS, cn } from '../../lib/utils';
import { SITES, type SiteId, type HourlyMeterData } from '@common/types/odyssey';

interface EnergyChartProps {
  data: any[];
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
  valuePrefix?: string;
  type?: 'line' | 'area' | 'bar';
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-odyssey-border p-3 text-xs">
      <p className="text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white font-mono">{p.dataKey}: {p.value?.toFixed(1)} kWh</span>
        </div>
      ))}
    </div>
  );
};

export function EnergyChart({ data, loading, title, description, className, valuePrefix, type }: EnergyChartProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl border border-odyssey-border p-6">
        <div className="h-5 w-48 shimmer-bg rounded mb-4" />
        <div className="h-64 shimmer-bg rounded-lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl border border-odyssey-border p-6 flex items-center justify-center h-80">
        <p className="text-muted-foreground text-sm">No energy data available</p>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-xl border border-odyssey-border p-6 flex flex-col", className)}>
      <div className="mb-6">
        <h3 className="font-display font-semibold text-white">{title || 'Energy Consumption'}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description || 'kWh per site — last 30 days'}</p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {SITES.map(site => (
                <linearGradient key={site} id={`grad-${site}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SITE_COLORS[site]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SITE_COLORS[site]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#64748b' }}
            />
            {SITES.map(site => (
              <Area
                key={site}
                type="monotone"
                dataKey={site}
                stroke={SITE_COLORS[site]}
                strokeWidth={1.5}
                fill={`url(#grad-${site})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
