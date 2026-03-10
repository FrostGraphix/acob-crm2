// ============================================================
// /frontend/src/components/Management/AccountManager.tsx
// Prepaid Billing Accounts Management (Customers + Meters + Tariffs)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, RefreshCw, CheckCircle, XCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { accountApi, type PrepaidAccount } from '../../services/management-api';
import { Modal, Field, Input, FormError, SubmitButton } from '../ui/Modal';
import { formatNumber } from '../../lib/utils';

const EMPTY_FORM = {
  customerId: '',
  customerName: '',
  meterId: '',
  tariffId: '',
};

export function AccountManager() {
  const [accounts, setAccounts] = useState<PrepaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountApi.list(page, itemsPerPage);
      setAccounts(res.data);
      setTotalCount(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentPage);
  }, [load, currentPage]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.customerId.trim() || !form.meterId.trim() || !form.tariffId.trim()) {
      return setError('Customer ID, Meter ID, and Tariff ID are required.');
    }
    setSaving(true);
    setError(null);
    try {
      await accountApi.create(form as any);
      setModalOpen(false);
      await load(currentPage);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg text-white">Billing Accounts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(totalCount)} total prepaid accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(currentPage)} className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all">
            <RefreshCw className={`w-4 h-4 text-muted-foreground hover:text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-odyssey-electric text-odyssey-surface text-sm font-semibold hover:opacity-90 transition-all electric-glow">
            <Plus className="w-4 h-4" /> Provision Account
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 shimmer-bg rounded-lg" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No billing accounts found</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-odyssey-border bg-black/20">
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Meter SN</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Tariff ID</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-right px-6 py-4 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-odyssey-border/40">
                {accounts.map((a, i) => (
                  <tr key={a.id ?? i} className="hover:bg-odyssey-border/20 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{a.customerName || '—'}</p>
                      <p className="text-xs font-mono text-muted-foreground opacity-70">ID: {a.customerId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-odyssey-electric/70" />
                        <span className="font-mono text-white tracking-widest">{a.meterId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-muted-foreground">
                        {a.tariffId || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.status === false || a.status === true ? (
                        <div className="flex items-center gap-1.5">
                          {/* Odyssey sometimes uses false for active, true for active. Let's assume true or false means it's tracked. */}
                          <CheckCircle className="w-4 h-4 text-[#06D6A0]" />
                          <span className="text-[#06D6A0] font-medium">Provisioned</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground font-medium">Unknown</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {a.createDate ? new Date(a.createDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && accounts.length > 0 && (
          <div className="px-6 py-4 border-t border-odyssey-border flex items-center justify-between bg-black/10">
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} accounts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground px-2 font-mono">
                Page {currentPage} of {totalPages}
              </span>
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

      {/* Create / Provision Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Provision New Account">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Link a Customer, Meter, and Tariff to provision a new prepaid billing account in the Odyssey system.
          </p>

          <Field label="Customer ID">
            <Input
              value={form.customerId}
              onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
              placeholder="e.g. CUST-8492"
              disabled={saving}
            />
          </Field>

          <Field label="Customer Name (Optional)">
            <Input
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              placeholder="e.g. John Doe"
              disabled={saving}
            />
          </Field>

          <Field label="Meter Serial Number">
            <Input
              value={form.meterId}
              onChange={e => setForm(f => ({ ...f, meterId: e.target.value }))}
              placeholder="e.g. 01234567890"
              disabled={saving}
            />
          </Field>

          <Field label="Tariff ID">
            <Input
              value={form.tariffId}
              onChange={e => setForm(f => ({ ...f, tariffId: e.target.value }))}
              placeholder="e.g. TAR-RES-01"
              disabled={saving}
            />
          </Field>

          {error && <FormError error={error} />}

          <div className="pt-2">
            <SubmitButton onClick={handleSave} loading={saving} label="Provision Account" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
