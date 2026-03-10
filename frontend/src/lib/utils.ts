import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatKwh(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} GWh`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} MWh`;
  return `${formatNumber(value)} kWh`;
}

export function formatDate(dateStr: string, style: 'short' | 'long' = 'long'): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: style === 'short' ? 'medium' : 'long',
    ...(style === 'long' && { timeStyle: 'short' }),
  }).format(date);
}

export function toISODate(date: Date): string {
  return date.toISOString();
}

export function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const SITE_COLORS: Record<string, string> = {
  KYAKALE: '#06D6A0',
  MUSHA: '#00B4D8',
  UMAISHA: '#FFB703',
  TUNGA: '#FB8500',
  OGUFA: '#EF4444',
};
