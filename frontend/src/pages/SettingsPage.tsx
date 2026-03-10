// ============================================================
// /frontend/src/pages/SettingsPage.tsx
// Settings & Admin — Stations, Roles, Users tabs
// ============================================================
import { useState, useEffect, FormEvent } from 'react';
import {
    Building2, Shield, Users, Plus, Edit, Search, RefreshCw,
    Loader2, CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { settingsApi, Station, Role, UserRecord } from '../services/settings-api';
import { cn } from '../lib/utils';

const TABS = [
    { id: 'stations', label: 'Stations', icon: Building2, desc: 'View and manage site station configurations' },
    { id: 'roles', label: 'Roles', icon: Shield, desc: 'Define permission roles and scope assignments' },
    { id: 'users', label: 'Users', icon: Users, desc: 'Manage operator accounts, roles, and access' },
] as const;

type TabId = typeof TABS[number]['id'];

// ══════════════════════════════════════════════════════════════
// STATIONS TAB
// ══════════════════════════════════════════════════════════════
function StationsTab() {
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStations = async () => {
        setLoading(true);
        try { setStations(await settingsApi.listStations()); } catch { } finally { setLoading(false); }
    };
    useEffect(() => { fetchStations(); }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stations.length} station(s) across all sites</p>
                <button onClick={fetchStations} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-odyssey-border/50 transition-all">
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
                </button>
            </div>

            <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-odyssey-border text-muted-foreground text-left">
                                <th className="px-4 py-3 font-medium">Station ID</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium">Address</th>
                                <th className="px-4 py-3 font-medium">Coordinates</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                            )}
                            {!loading && stations.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No stations found</td></tr>
                            )}
                            {stations.map((s, i) => (
                                <tr key={i} className="border-b border-odyssey-border/50 hover:bg-odyssey-border/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-odyssey-accent">{s.stationId ?? '—'}</td>
                                    <td className="px-4 py-3 text-white">{s.stationName ?? '—'}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.siteId}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.address ?? '—'}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                                        {s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// ROLES TAB
// ══════════════════════════════════════════════════════════════
function RolesTab() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ roleName: '', description: '', scopes: '' });
    const [saving, setSaving] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try { setRoles(await settingsApi.listRoles()); } catch { } finally { setLoading(false); }
    };
    useEffect(() => { fetchRoles(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settingsApi.createRole({
                roleName: formData.roleName,
                description: formData.description,
                scopes: formData.scopes.split(',').map(s => s.trim()).filter(Boolean),
            });
            setShowForm(false);
            setFormData({ roleName: '', description: '', scopes: '' });
            fetchRoles();
        } catch { } finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{roles.length} role(s) defined</p>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
                    {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Role</>}
                </button>
            </div>

            {showForm && (
                <div className="glass rounded-xl border border-odyssey-border p-5 animate-fade-in">
                    <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                            <input value={formData.roleName} onChange={e => setFormData(p => ({ ...p, roleName: e.target.value }))} required className="input-field" placeholder="e.g. Supervisor" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} required className="input-field" placeholder="Role purpose" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Scopes (comma-separated)</label>
                            <input value={formData.scopes} onChange={e => setFormData(p => ({ ...p, scopes: e.target.value }))} className="input-field" placeholder="Token.CreditToken, ..." />
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                            <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Role'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading && <div className="sm:col-span-3 flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
                {roles.map((role, i) => (
                    <div key={i} className="glass rounded-xl border border-odyssey-border p-5 space-y-3 hover:border-odyssey-mid/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-odyssey-blue/30 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-odyssey-accent" />
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{role.RoleName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{role.RoleId}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{role.Description}</p>
                        <div className="flex flex-wrap gap-1">
                            {(role.scopes ?? []).slice(0, 4).map((scope, j) => (
                                <span key={j} className="px-2 py-0.5 rounded bg-odyssey-border/60 text-xs text-muted-foreground font-mono">{scope}</span>
                            ))}
                            {(role.scopes ?? []).length > 4 && (
                                <span className="px-2 py-0.5 rounded bg-odyssey-border/60 text-xs text-muted-foreground">+{role.scopes.length - 4} more</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// USERS TAB
// ══════════════════════════════════════════════════════════════
function UsersTab() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ userName: '', password: '', roleId: '', realName: '' });
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try { setUsers(await settingsApi.listUsers()); } catch { } finally { setLoading(false); }
    };
    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settingsApi.createUser(formData);
            setShowForm(false);
            setFormData({ userName: '', password: '', roleId: '', realName: '' });
            fetchUsers();
        } catch { } finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{users.length} user(s)</p>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
                    {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add User</>}
                </button>
            </div>

            {showForm && (
                <div className="glass rounded-xl border border-odyssey-border p-5 animate-fade-in">
                    <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Username</label>
                            <input value={formData.userName} onChange={e => setFormData(p => ({ ...p, userName: e.target.value }))} required className="input-field" placeholder="e.g. jdoe" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                            <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={6} className="input-field" placeholder="Min 6 characters" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Role ID</label>
                            <input value={formData.roleId} onChange={e => setFormData(p => ({ ...p, roleId: e.target.value }))} required className="input-field" placeholder="e.g. 0001" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Real Name</label>
                            <input value={formData.realName} onChange={e => setFormData(p => ({ ...p, realName: e.target.value }))} required className="input-field" placeholder="Full name" />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                            <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-odyssey-border text-muted-foreground text-left">
                                <th className="px-4 py-3 font-medium">User ID</th>
                                <th className="px-4 py-3 font-medium">Username</th>
                                <th className="px-4 py-3 font-medium">Real Name</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No users found</td></tr>
                            )}
                            {users.map((u, i) => (
                                <tr key={i} className="border-b border-odyssey-border/50 hover:bg-odyssey-border/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-odyssey-accent">{u.UserId}</td>
                                    <td className="px-4 py-3 text-white">{u.UserName}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.RealName ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded bg-odyssey-blue/20 text-xs font-medium text-white">{u.RoleName ?? u.RoleId}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', u.Active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400')}>
                                            {u.Active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('stations');
    const active = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white tracking-tight">Settings & Admin</h1>
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
            {activeTab === 'stations' && <StationsTab />}
            {activeTab === 'roles' && <RolesTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
    );
}
