// ============================================================
// /frontend/src/pages/ManagementPage.tsx
// Tabbed management hub — Gateway, Customer, Tariff, Account
// ============================================================
import { useState } from 'react';
import { Router, Users, DollarSign, Shield, Cpu } from 'lucide-react';
import { GatewayManager } from '../components/Management/GatewayManager';
import { MeterRegistry } from '../components/Management/MeterRegistry';
import { CustomerManager } from '../components/Management/CustomerManager';
import { TariffManager } from '../components/Management/TariffManager';
import { AccountManager } from '../components/Management/AccountManager';
import { ConsumptionAnalytics } from '../components/Management/ConsumptionAnalytics';
import { cn } from '../lib/utils';
import { BarChart3 } from 'lucide-react';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: ConsumptionAnalytics, desc: 'Robust data trends and site-wide energy consumption analysis' },
  { id: 'gateways', label: 'Gateways', icon: Router, component: GatewayManager, desc: 'Register and monitor communication gateways across all sites' },
  { id: 'meters', label: 'Meters', icon: Cpu, component: MeterRegistry, desc: 'Complete meter registry — serial numbers, revenue, energy consumption, purchase history' },
  { id: 'customers', label: 'Customers', icon: Users, component: CustomerManager, desc: 'Customer registry — link meters to accounts and tariffs' },
  { id: 'tariffs', label: 'Tariffs', icon: DollarSign, component: TariffManager, desc: 'Manage electricity tariff rates with effective dates and approval audit trail' },
  { id: 'accounts', label: 'Accounts', icon: Shield, component: AccountManager, desc: 'Prepaid billing accounts linking customers, meters, and tariffs' },
] as const;

type TabId = typeof TABS[number]['id'];

export function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>('analytics');
  const active = TABS.find(t => t.id === activeTab)!;
  const ActiveComponent = active.component;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Management</h1>
        <p className="text-muted-foreground text-sm mt-1">{active.desc}</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 glass rounded-xl border border-odyssey-border w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-odyssey-blue/50 text-white border border-odyssey-mid/40'
                : 'text-muted-foreground hover:text-white hover:bg-odyssey-border/40'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <ActiveComponent />
    </div>
  );
}
