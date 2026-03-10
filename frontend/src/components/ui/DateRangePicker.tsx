// ============================================================
// /frontend/src/components/ui/DateRangePicker.tsx
// ============================================================
import { CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  className?: string;
}

export function DateRangePicker({ from, to, onFromChange, onToChange, className }: DateRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <input
        type="date"
        value={from.slice(0, 10)}
        onChange={e => onFromChange(new Date(e.target.value).toISOString())}
        className="glass border border-odyssey-border rounded-lg px-3 py-2 text-xs text-white bg-transparent focus:outline-none focus:border-odyssey-mid/60"
      />
      <span className="text-muted-foreground text-xs">to</span>
      <input
        type="date"
        value={to.slice(0, 10)}
        onChange={e => onToChange(new Date(e.target.value).toISOString())}
        className="glass border border-odyssey-border rounded-lg px-3 py-2 text-xs text-white bg-transparent focus:outline-none focus:border-odyssey-mid/60"
      />
    </div>
  );
}

// Quick preset buttons
interface PresetProps { onSelect: (from: string, to: string) => void; }
export function DatePresets({ onSelect }: PresetProps) {
  const presets = [
    { label: '7d',  days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: '1y',  days: 365 },
  ];
  return (
    <div className="flex items-center gap-1">
      {presets.map(({ label, days }) => (
        <button
          key={label}
          onClick={() => {
            const to = new Date().toISOString();
            const from = new Date(Date.now() - days * 86400000).toISOString();
            onSelect(from, to);
          }}
          className="px-2.5 py-1.5 text-xs rounded-lg glass border border-odyssey-border text-muted-foreground hover:text-white hover:border-odyssey-mid/40 transition-all"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
