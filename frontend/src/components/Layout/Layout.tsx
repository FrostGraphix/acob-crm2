// ============================================================
// /frontend/src/components/Layout/Layout.tsx
// ============================================================
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Activity, FileBarChart,
  ChevronRight, ChevronDown, Radio, Building2, LogOut
} from 'lucide-react';
import { cn, SITE_COLORS } from '../../lib/utils';
import { SITES, type SiteId } from '@common/types/odyssey';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    icon: Zap,
    label: 'Token Generate',
    subItems: [
      { to: '/token-generate/credit', label: 'Credit Token' },
      { to: '/token-generate/clear-tamper', label: 'Clear Tamper Token' },
      { to: '/token-generate/clear-credit', label: 'Clear Credit Token' },
      { to: '/token-generate/max-power', label: 'Set Maximum Power Limit Token' }
    ]
  },
  {
    icon: FileBarChart,
    label: 'Token Record',
    subItems: [
      { to: '/token-record/credit', label: 'Credit Token Record' },
      { to: '/token-record/clear-tamper', label: 'Clear Tamper Token Record' },
      { to: '/token-record/clear-credit', label: 'Clear Credit Token Record' },
      { to: '/token-record/max-power', label: 'Set Maximum Power Limit Token Record' }
    ]
  },
  {
    icon: Activity,
    label: 'Remote Operation',
    subItems: [
      { to: '/remote-operation/reading', label: 'Meter Reading' },
      { to: '/remote-operation/control', label: 'Meter Control' },
      { to: '/remote-operation/token', label: 'Meter Token' }
    ]
  },
  {
    icon: Activity,
    label: 'Remote Operation Task',
    subItems: [
      { to: '/remote-operation-task/reading', label: 'Meter Reading Task' },
      { to: '/remote-operation-task/control', label: 'Meter Control Task' },
      { to: '/remote-operation-task/token', label: 'Meter Token Task' }
    ]
  },
  {
    icon: FileBarChart,
    label: 'Data Report',
    subItems: [
      { to: '/data-report/account-long', label: 'Long Nonpurchase Situation' },
      { to: '/data-report/account-low', label: 'Low Purchase Situation' },
      { to: '/data-report/consumption', label: 'Consumption Statistics' },
      { to: '/data-report/meter-data', label: 'Interval Data' }
    ]
  },
  {
    icon: Building2,
    label: 'Management',
    subItems: [
      { to: '/management/gateway', label: 'Gateway' },
      { to: '/management/customer', label: 'Customer' },
      { to: '/management/tariff', label: 'Tariff' },
      { to: '/management/account', label: 'Account' },
    ]
  },
];

function NavItemComponent({ item, isCollapsed, pathname }: { item: any; isCollapsed: boolean; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open if nested active
  useEffect(() => {
    if (item.subItems && item.subItems.some((s: any) => pathname.startsWith(s.to))) {
      setIsOpen(true);
    }
  }, [pathname, item.subItems]);

  const Icon = item.icon;
  const isOuterActive = item.to ? pathname.startsWith(item.to) : item.subItems?.some((s: any) => pathname.startsWith(s.to));

  if (!item.subItems) {
    return (
      <NavLink
        to={item.to}
        title={isCollapsed ? item.label : undefined}
        className={({ isActive }) => cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
          isActive
            ? 'bg-odyssey-blue/40 text-white glass-bright'
            : 'text-muted-foreground hover:text-white hover:bg-odyssey-border/50'
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
            {item.label}
          </motion.span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-odyssey-surface border border-odyssey-border rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
            {item.label}
          </div>
        )}
      </NavLink>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          if (isCollapsed) return; // Optional logic: could try hovering
          setIsOpen(!isOpen);
        }}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
          isOuterActive && !isOpen
            ? 'text-white'
            : 'text-muted-foreground hover:text-white hover:bg-odyssey-border/50'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0", isOuterActive ? "text-odyssey-electric" : "")} />
          {!isCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {item.label}
            </motion.span>
          )}
        </div>
        {!isCollapsed && (
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} />
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-odyssey-surface border border-odyssey-border rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
            {item.label} (Expand Sidebar)
          </div>
        )}
      </button>

      {!isCollapsed && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 ml-4 border-l border-odyssey-border/50 pl-2 space-y-0.5"
            >
              {item.subItems.map((sub: any) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  className={({ isActive }) => cn(
                    'block px-3 py-2 rounded-lg text-xs transition-all duration-200 w-full text-left',
                    isActive
                      ? 'bg-odyssey-electric/10 text-white font-semibold'
                      : 'text-muted-foreground hover:text-white hover:bg-odyssey-border/40'
                  )}
                >
                  {sub.label}
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ... SITES const stays the same ...

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const sidebarWidth = isCollapsed ? 80 : 256;
  return (
    <div className="flex h-screen bg-odyssey-surface overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 glass border-r border-odyssey-border flex flex-col relative z-[60]"
      >
        {/* Logo */}
        <div className={cn("p-6 border-b border-odyssey-border transition-all duration-300", isCollapsed ? "px-4" : "p-6")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-odyssey-accent to-odyssey-electric flex items-center justify-center blue-glow shrink-0">
              <Radio className="w-5 h-5 text-odyssey-surface" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="font-display font-bold text-white text-sm leading-tight">ACOB Odyssey</p>
                <p className="text-odyssey-accent text-xs font-mono">Metering Platform</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin overflow-x-hidden">
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Main Menu
            </p>
          )}
          {NAV_ITEMS.map((item, idx) => (
            <NavItemComponent key={idx} item={item} isCollapsed={isCollapsed} pathname={location.pathname} />
          ))}

          {/* Site indicators */}
          <div className="pt-6">
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Live Sites
              </p>
            )}
            <div className="space-y-1.5">
              {SITES.map(site => (
                <div
                  key={site}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-odyssey-border/30 transition-colors group relative"
                  title={isCollapsed ? site : undefined}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse-slow shrink-0"
                    style={{ backgroundColor: SITE_COLORS[site], boxShadow: `0 0 8px ${SITE_COLORS[site]}` }}
                  />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground font-mono"
                    >
                      {site}
                    </motion.span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-odyssey-border space-y-2">
          <div className={cn("flex items-center gap-3 py-2", isCollapsed ? "px-2" : "px-3")}>
            <div className="w-8 h-8 rounded-full bg-odyssey-blue/40 border border-odyssey-mid/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-odyssey-accent">{(user?.operatorName ?? 'OP').slice(0, 2).toUpperCase()}</span>
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-[11px] text-white truncate font-medium">{user?.operatorName ?? user?.username}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.roleId || 'Operator'}</p>
              </motion.div>
            )}
          </div>
          <button onClick={logout} className={cn("flex items-center gap-3 w-full py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all group relative", isCollapsed ? "px-3" : "px-3")}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 glass border-b border-odyssey-border flex items-center justify-between px-6 flex-shrink-0 relative z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
            >
              <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isCollapsed ? "" : "rotate-180")} />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-white font-medium tracking-tight">
                {useCurrentPageTitle()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <div className="w-2 h-2 rounded-full bg-odyssey-electric animate-pulse-slow" />
              <span>Live</span>
            </div>

            <NotificationDropdown />

            <div className="w-8 h-8 rounded-full bg-odyssey-blue/40 border border-odyssey-mid/40 flex items-center justify-center">
              <span className="text-xs font-bold text-odyssey-accent">OP</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function useCurrentPageTitle() {
  const location = useLocation();
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/management': 'Management',
  };
  return map[location.pathname] ?? 'ACOB Odyssey';
}
