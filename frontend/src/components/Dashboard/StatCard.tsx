// ============================================================
// /frontend/src/components/Dashboard/StatCard.tsx
// ============================================================
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: 'blue' | 'green' | 'amber' | 'red';
  loading?: boolean;
}

const ACCENTS = {
  blue:  { bg: 'bg-odyssey-accent/10',  icon: 'text-odyssey-accent',  border: 'border-odyssey-accent/20',  glow: 'blue-glow' },
  green: { bg: 'bg-odyssey-electric/10', icon: 'text-odyssey-electric', border: 'border-odyssey-electric/20', glow: 'electric-glow' },
  amber: { bg: 'bg-amber-500/10',         icon: 'text-amber-400',        border: 'border-amber-500/20',        glow: '' },
  red:   { bg: 'bg-red-500/10',           icon: 'text-red-400',          border: 'border-red-500/20',          glow: '' },
};

export function StatCard({
  title, value, subtitle, icon: Icon, trend, accent = 'blue', loading
}: StatCardProps) {
  const a = ACCENTS[accent];

  if (loading) {
    return (
      <div className="glass rounded-xl p-5 border border-odyssey-border animate-pulse">
        <div className="h-4 w-24 shimmer-bg rounded mb-4" />
        <div className="h-8 w-32 shimmer-bg rounded mb-2" />
        <div className="h-3 w-20 shimmer-bg rounded" />
      </div>
    );
  }

  return (
    <div className={cn(
      'glass rounded-xl p-5 border transition-all duration-300 hover:-translate-y-0.5',
      `border-${a.border}`,
      'border-odyssey-border hover:border-odyssey-mid/40 animate-fade-in'
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-2 rounded-lg', a.bg)}>
          <Icon className={cn('w-4 h-4', a.icon)} />
        </div>
      </div>

      <p className="text-2xl font-display font-bold text-white mb-1 tracking-tight">
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}

      {trend && (
        <div className={cn(
          'mt-3 flex items-center gap-1.5 text-xs font-medium',
          trend.value >= 0 ? 'text-odyssey-electric' : 'text-red-400'
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
