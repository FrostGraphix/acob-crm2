// ============================================================
// /frontend/src/components/ui/Modal.tsx
// Shared modal component for all management forms
// ============================================================
import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative w-full glass-bright rounded-2xl border border-odyssey-mid/30 shadow-2xl animate-fade-in',
        SIZES[size]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-odyssey-border">
          <div>
            <h2 className="font-display font-bold text-white text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-odyssey-border/60 transition-colors text-muted-foreground hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Form field helpers ────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full glass border border-odyssey-border rounded-lg px-3 py-2.5 text-sm text-white bg-transparent',
        'focus:outline-none focus:border-odyssey-mid/60 placeholder:text-muted-foreground/40 font-sans',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full glass border border-odyssey-border rounded-lg px-3 py-2.5 text-sm text-white bg-odyssey-card',
        'focus:outline-none focus:border-odyssey-mid/60',
        'disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full glass border border-odyssey-border rounded-lg px-3 py-2.5 text-sm text-white bg-transparent',
        'focus:outline-none focus:border-odyssey-mid/60 placeholder:text-muted-foreground/40 resize-none',
        className
      )}
      {...props}
    />
  );
}

export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
      <span>⚠</span> {error}
    </div>
  );
}

export function SubmitButton({
  loading, label, loadingLabel, onClick
}: { loading?: boolean; label: string; loadingLabel?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-odyssey-accent text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed blue-glow"
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {loading ? (loadingLabel ?? 'Saving...') : label}
    </button>
  );
}
