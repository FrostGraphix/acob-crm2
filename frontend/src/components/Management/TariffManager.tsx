// ============================================================
// /frontend/src/components/Management/TariffManager.tsx
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Pencil, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { tariffApi, type Tariff } from '../../services/management-api';
import { SITES, type SiteId } from '@common/types/odyssey';
import { SITE_COLORS, formatNumber } from '../../lib/utils';
import { Modal, Field, Input, Select, FormError, SubmitButton } from '../ui/Modal';

const EMPTY_FORM = {
  name: '', siteId: 'KYAKALE' as SiteId,
  ratePerKwh: '', currency: 'NGN',
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '', approvedBy: '',
};

export function TariffManager() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tariffApi.list(filterSite === 'ALL' ? undefined : filterSite);
      setTariffs(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterSite]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(null); setModalOpen(true);
  }

  function openEdit(t: Tariff) {
    setEditing(t);
    setForm({
      name: t.name, siteId: t.siteId as SiteId, ratePerKwh: String(t.ratePerKwh),
      currency: t.currency, effectiveFrom: t.effectiveFrom?.slice(0, 10) ?? '',
      effectiveTo: t.effectiveTo?.slice(0, 10) ?? '', approvedBy: t.approvedBy,
    });
    setError(null); setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ratePerKwh || !form.approvedBy.trim()) {
      return setError('Name, rate per kWh and approver ID are required.');
    }
    const rate = parseFloat(form.ratePerKwh);
    if (isNaN(rate) || rate <= 0) return setError('Rate must be a positive number.');

    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        ratePerKwh: rate,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        effectiveTo: form.effectiveTo ? new Date(form.effectiveTo).toISOString() : undefined,
      };
      if (editing) {
        await tariffApi.update(editing.id, payload);
      } else {
        await tariffApi.create(payload as any);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const filtered = filterSite === 'ALL' ? tariffs : tariffs.filter(t => t.siteId === filterSite);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={filterSite} onChange={e => setFilterSite(e.target.value as any)} className="w-40 py-2 text-xs">
            <option value="ALL">All Sites</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} tariff{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-odyssey-accent text-white text-sm font-semibold hover:opacity-90 transition-all blue-glow">
            <Plus className="w-4 h-4" /> Create Tariff
          </button>
        </div>
      </div>

      {/* Tariff warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Tariff changes require supervisor approval. All rate updates are logged with effective date and approver ID for regulatory compliance.</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 shimmer-bg rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl border border-odyssey-border py-16 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No tariffs defined</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const color = SITE_COLORS[t.siteId] ?? '#64748b';
            const isActive = !t.effectiveTo || new Date(t.effectiveTo) > new Date();
            return (
              <div key={t.id ?? i} className="glass rounded-xl border border-odyssey-border hover:border-odyssey-mid/40 transition-all p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-white text-sm">{t.name}</p>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ backgroundColor: `${color}18`, color }}>
                      {t.siteId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${isActive ? 'text-odyssey-electric bg-odyssey-electric/10 border-odyssey-electric/30' : 'text-muted-foreground bg-odyssey-border/30 border-odyssey-border'}`}>
                      {isActive ? <CheckCircle className="w-3 h-3" /> : null}
                      {isActive ? 'Active' : 'Expired'}
                    </span>
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground hover:text-white transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rate — prominent display */}
                <div className="mb-4 p-3 rounded-lg bg-odyssey-electric/5 border border-odyssey-electric/20">
                  <p className="text-xs text-muted-foreground mb-0.5">Rate per kWh</p>
                  <p className="text-2xl font-display font-bold text-odyssey-electric">
                    {t.currency === 'NGN' ? '₦' : t.currency}{formatNumber(t.ratePerKwh, 2)}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective From</span>
                    <span className="text-white">{new Date(t.effectiveFrom).toLocaleDateString()}</span>
                  </div>
                  {t.effectiveTo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effective To</span>
                      <span className="text-white">{new Date(t.effectiveTo).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved By</span>
                    <span className="font-mono text-white">{t.approvedBy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Tariff' : 'Create Tariff'}
        subtitle="Tariff changes are logged and require supervisor approval"
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tariff Name" required>
            <Input placeholder="e.g. Standard Residential R1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Site" required>
            <Select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value as SiteId }))}>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Rate per kWh" required hint="Current tariff rate in selected currency">
            <div className="flex items-center gap-2">
              <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-24 flex-shrink-0">
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
              </Select>
              <Input type="number" step="0.01" placeholder="25.00" value={form.ratePerKwh} onChange={e => setForm(f => ({ ...f, ratePerKwh: e.target.value }))} className="font-mono" />
            </div>
          </Field>
          <Field label="Approved By" required hint="Supervisor or manager ID authorising this change">
            <Input placeholder="Supervisor ID" value={form.approvedBy} onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))} className="font-mono" />
          </Field>
          <Field label="Effective From" required>
            <Input type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
          </Field>
          <Field label="Effective To" hint="Leave blank for open-ended tariff">
            <Input type="date" value={form.effectiveTo} onChange={e => setForm(f => ({ ...f, effectiveTo: e.target.value }))} />
          </Field>
        </div>
        <FormError error={error} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
          <SubmitButton loading={saving} label={editing ? 'Save Changes' : 'Create Tariff'} onClick={handleSave} />
        </div>
      </Modal>
    </div>
  );
}
