// ============================================================
// /frontend/src/components/Management/CustomerManager.tsx
// Demographic Customer CRM with Paginated API Fetching
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Search, RefreshCw, ChevronLeft, ChevronRight, Activity, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { customerApi, statsApi, type CustomerProfile, type CustomerStats } from '../../services/management-api';
import { Modal, Field, Input, FormError, SubmitButton } from '../ui/Modal';
import { formatNumber } from '../../lib/utils';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

const EMPTY_FORM = {
  name: '', phone: '', address: '', identityType: '', identityNumber: '',
};

export function CustomerManager() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Statistics from dedicated stats endpoint
  const [stats, setStats] = useState<CustomerStats | null>(null);

  const loadData = useCallback(async (page: number, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const [customersRes, statsRes] = await Promise.all([
        customerApi.list(page, itemsPerPage, query || undefined),
        statsApi.getCustomerStats()
      ]);
      setCustomers(customersRes.data);
      setTotalCount(customersRes.total);
      setStats(statsRes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentPage, search);
  }, [loadData, currentPage, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 on new search
    loadData(1, search);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: CustomerProfile) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      identityType: c.identityType || '',
      identityNumber: c.identityNumber || '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return setError('Customer Name is required.');
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await customerApi.update(editing.id, form);
      } else {
        await customerApi.create(form as any);
      }
      setModalOpen(false);
      await loadData(currentPage, search);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Registration', value: formatNumber(stats?.totalCustomers ?? 0), icon: Users, color: 'text-blue-400' },
          { label: 'Active Customers', value: formatNumber(stats?.activeCustomers ?? 0), icon: Activity, color: 'text-odyssey-electric' },
          { label: 'Total Top-ups', value: formatNumber(stats?.totalTransactions ?? 0), icon: Activity, color: 'text-purple-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass rounded-xl p-4 border border-odyssey-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-xl font-display font-bold text-white mt-0.5">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg bg-white/5 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/10 p-3 rounded-xl border border-odyssey-border/50">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cutomer names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/20 border border-odyssey-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-odyssey-primary transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadData(currentPage, search)}
            className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all flex-[0_0_auto]"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground hover:text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-odyssey-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* CRM Customer List */}
      <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 shimmer-bg rounded-xl" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-white font-medium">No customers found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your search criteria or register a new user.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-odyssey-border/50 bg-black/20 text-xs">
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Profile</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Verification</th>
                  <th className="text-right px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Registered</th>
                  <th className="text-right px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-odyssey-border/30">
                {customers.map((c) => {
                  const avatarSvg = createAvatar(initials, { seed: c.name, radius: 10, scale: 90, backgroundColor: ['1e293b'] }).toDataUri();
                  return (
                    <tr key={c.id} className="hover:bg-odyssey-border/10 transition-colors group">

                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={avatarSvg} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            <p className="text-xs font-mono text-muted-foreground opacity-80 mt-0.5">ID: {c.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span className={c.phone ? 'text-white' : 'text-muted-foreground/50 italic'}>
                              {c.phone || 'No phone listed'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span className={c.address ? 'text-muted-foreground' : 'text-muted-foreground/50 italic'}>
                              {c.address || 'No address provided'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* KYC Verification */}
                      <td className="px-6 py-4">
                        {(c.identityType || c.identityNumber) ? (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#06D6A0]" />
                            <div>
                              <p className="text-xs font-medium text-white">{c.identityType || 'Verified'}</p>
                              {c.identityNumber && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{c.identityNumber}</p>}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-muted-foreground">Unverified</span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-muted-foreground text-xs whitespace-nowrap">
                          {c.createDate ? new Date(c.createDate).toLocaleDateString() : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 border-t border-odyssey-border flex items-center justify-between bg-black/20">
            <p className="text-xs text-muted-foreground">
              Showing <span className="text-white font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="text-white font-medium">{formatNumber(totalCount)}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 rounded bg-black/30 border border-white/5 text-xs text-muted-foreground font-mono">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? 'Edit Profile' : 'Register Customer'}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            {editing ? 'Update contact and verification details for this customer.' : 'Register a new customer demographic profile before provision a billing account.'}
          </p>

          <Field label="Full Name">
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Adebayo Ibrahim"
              disabled={saving}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number">
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +234 800 000 0000"
                disabled={saving}
              />
            </Field>
            <Field label="Identity Doc Type">
              <Input
                value={form.identityType}
                onChange={e => setForm(f => ({ ...f, identityType: e.target.value }))}
                placeholder="e.g. NIN, Passport"
                disabled={saving}
              />
            </Field>
          </div>

          <Field label="Identity Doc Number">
            <Input
              value={form.identityNumber}
              onChange={e => setForm(f => ({ ...f, identityNumber: e.target.value }))}
              placeholder="Enter verification number..."
              disabled={saving}
            />
          </Field>

          <Field label="Physical Address">
            <Input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Enter full address..."
              disabled={saving}
            />
          </Field>

          {error && <FormError error={error} />}

          <div className="pt-2">
            <SubmitButton onClick={handleSave} loading={saving} label={editing ? 'Save Changes' : 'Register Customer'} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
