// ============================================================
// /frontend/src/components/Dashboard/EventsFeed.tsx
// ============================================================
import { AlertTriangle, Zap, WifiOff, Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { type EventNotification, type SiteId, SITES } from '@common/types/odyssey';
import { SITE_COLORS, cn } from '../../lib/utils';

const EVENT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  TAMPER_DETECTED: { icon: Shield, color: '#EF4444', label: 'Tamper Detected' },
  COVER_OPEN: { icon: Shield, color: '#FB8500', label: 'Cover Open' },
  POWER_FAIL: { icon: WifiOff, color: '#EF4444', label: 'Power Failure' },
  POWER_RESTORE: { icon: Zap, color: '#06D6A0', label: 'Power Restored' },
  LOW_CREDIT: { icon: AlertTriangle, color: '#FFB703', label: 'Low Credit' },
  REVERSE_ENERGY: { icon: Activity, color: '#FB8500', label: 'Reverse Energy' },
  OVER_CURRENT: { icon: Zap, color: '#EF4444', label: 'Over Current' },
  COMMUNICATION_FAIL: { icon: WifiOff, color: '#64748b', label: 'Comm Failure' },
};

interface EventsFeedProps {
  events: EventNotification[];
  loading?: boolean;
  className?: string;
}

export function EventsFeed({ events, loading, className }: EventsFeedProps) {
  if (loading) {
    return (
      <div className={cn("glass rounded-xl border border-odyssey-border p-6", className)}>
        <div className="h-5 w-36 shimmer-bg rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 shimmer-bg rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
      <div className="px-6 py-4 border-b border-odyssey-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-white">Recent Events</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All sites — real-time alerts</p>
        </div>
        {events.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
            {events.length} alerts
          </span>
        )}
      </div>

      <div className="divide-y divide-odyssey-border/50 max-h-96 overflow-y-auto scrollbar-thin">
        {events.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">
            No recent events
          </div>
        ) : (
          events.map((event, i) => {
            const cfg = EVENT_CONFIG[event.eventType] ?? {
              icon: Activity, color: '#64748b', label: event.eventType
            };
            const Icon = cfg.icon;
            const siteColor = SITE_COLORS[event.siteId];

            return (
              <div key={event.id ?? i} className="px-6 py-3.5 hover:bg-odyssey-border/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded-md mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: `${cfg.color}18` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white">{cfg.label}</span>
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${siteColor}20`, color: siteColor }}
                      >
                        {event.siteId}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {event.meterSN}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
                    {event.timestamp
                      ? format(new Date(event.timestamp), 'HH:mm')
                      : '--:--'
                    }
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
