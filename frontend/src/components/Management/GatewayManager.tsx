// ============================================================
// /frontend/src/components/Management/GatewayManager.tsx
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { Router, Plus, Wifi, WifiOff, Pencil, Trash2, RefreshCw, Signal } from 'lucide-react';
import { gatewayApi, type Gateway } from '../../services/management-api';
import { SITES, type SiteId } from '@common/types/odyssey';
import { SITE_COLORS, formatNumber } from '../../lib/utils';
import { Modal, Field, Input, Select, Textarea, FormError, SubmitButton } from '../ui/Modal';

const PROTOCOLS = ['GPRS', 'Ethernet', 'WiFi', 'RS485', 'LoRa'] as const;

const EMPTY_FORM = {
  name: '', siteId: 'KYAKALE' as SiteId, ipAddress: '',
  protocol: 'GPRS' as Gateway['protocol'], location: '', notes: '',
};

export function GatewayManager() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gateway | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Gateway | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gatewayApi.list(filterSite === 'ALL' ? undefined : filterSite);
      setGateways(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterSite]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(gw: Gateway) {
    setEditing(gw);
    setForm({
      name: gw.name, siteId: gw.siteId as SiteId,
      ipAddress: gw.ipAddress, protocol: gw.protocol,
      location: gw.location, notes: gw.notes ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ipAddress.trim() || !form.location.trim()) {
      return setError('Name, IP address and location are required.');
    }
    setSaving(true); setError(null);
    try {
      if (editing) {
        await gatewayApi.update(editing.id, { ...form });
      } else {
        await gatewayApi.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(gw: Gateway) {
    try {
      await gatewayApi.remove(gw.id, gw.siteId);
      setDeleteConfirm(null);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const filtered = filterSite === 'ALL' ? gateways : gateways.filter(g => g.siteId === filterSite);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={filterSite} onChange={e => setFilterSite(e.target.value as any)} className="w-40 py-2 text-xs">
            <option value="ALL">All Sites</option>
            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} gateway{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-odyssey-accent text-white text-sm font-semibold hover:opacity-90 transition-all blue-glow">
            <Plus className="w-4 h-4" /> Add Gateway
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 shimmer-bg rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl border border-odyssey-border py-16 text-center">
          <Router className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No gateways registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(gw => {
            const color = SITE_COLORS[gw.siteId] ?? '#64748b';
            const online = gw.status === 'ONLINE';
            return (
              <div key={gw.id} className="glass rounded-xl border border-odyssey-border hover:border-odyssey-mid/40 transition-all p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${online ? 'bg-odyssey-electric/10' : 'bg-odyssey-border/40'}`}>
                      {online
                        ? <Wifi className="w-4 h-4 text-odyssey-electric" />
                        : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{gw.name}</p>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}18`, color }}>
                        {gw.siteId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(gw)} className="p-1.5 rounded-lg hover:bg-odyssey-border/60 text-muted-foreground hover:text-white transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(gw)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Address</span>
                    <span className="font-mono text-white">{gw.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol</span>
                    <span className="text-white">{gw.protocol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-white truncate max-w-[120px] text-right">{gw.location}</span>
                  </div>
                  {gw.connectedMeters !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected Meters</span>
                      <span className="text-odyssey-accent font-medium">{gw.connectedMeters}</span>
                    </div>
                  )}
                </div>

                {gw.lastSeen && (
                  <p className="text-xs text-muted-foreground/60 mt-3 pt-3 border-t border-odyssey-border/50">
                    Last seen {new Date(gw.lastSeen).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Gateway' : 'Register Gateway'}
        subtitle={editing ? `Editing ${editing.name}` : 'Add a new gateway to a site'}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Gateway Name" required>
            <Input placeholder="e.g. KYAKALE-GW-01" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Site" required>
            <Select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value as SiteId }))}>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="IP Address" required>
            <Input placeholder="e.g. 192.168.1.100" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} className="font-mono" />
          </Field>
          <Field label="Protocol" required>
            <Select value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value as any }))}>
              {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Location" required>
              <Input placeholder="Physical location / address" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea rows={2} placeholder="Optional installation notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
          </div>
        </div>
        <FormError error={error} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
          <SubmitButton loading={saving} label={editing ? 'Save Changes' : 'Register Gateway'} onClick={handleSave} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Decommission Gateway" size="sm">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to decommission <span className="text-white font-medium">{deleteConfirm?.name}</span>?
          This action will remove it from site <span className="text-white font-medium">{deleteConfirm?.siteId}</span> and cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2.5 text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all">
            Decommission
          </button>
        </div>
      </Modal>
    </div>
  );
}
