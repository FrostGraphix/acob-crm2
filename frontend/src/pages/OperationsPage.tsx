// ============================================================
// /frontend/src/pages/OperationsPage.tsx
// Remote Operations — 4 tabs: Reading, Control, Token, Monitor
// ============================================================
import { useState, useEffect, useRef, FormEvent } from 'react';
import {
    Activity, Wifi, WifiOff, Send, Radio, RefreshCw, Clock,
    CheckCircle2, XCircle, Loader2, AlertTriangle, Shield, Zap
} from 'lucide-react';
import { SITES, type SiteId } from '@common/types/odyssey';
import { operationsApi } from '../services/operations-api';
import { cn } from '../lib/utils';

const TABS = [
    { id: 'reading', label: 'Meter Reading', icon: Radio, desc: 'Read instantaneous meter values remotely via the gateway' },
    { id: 'control', label: 'Meter Control', icon: Activity, desc: 'Connect or disconnect meters — disconnect requires dual authorization' },
    { id: 'token', label: 'Remote Token', icon: Zap, desc: 'Deliver a 20-digit STS token directly to a meter via GPRS' },
    { id: 'monitor', label: 'Task Monitor', icon: Clock, desc: 'Live view of all recent remote operation tasks' },
] as const;

type TabId = typeof TABS[number]['id'];

const STATUS_CONFIG = {
    PENDING: { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending', animate: true },
    SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Success', animate: false },
    FAILED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed', animate: false },
    TIMEOUT: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Timeout', animate: false },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
            <Icon className={cn('w-3 h-3', cfg.animate && 'animate-spin')} />
            {cfg.label}
        </span>
    );
}

// ── METER READING TAB ────────────────────────────────────────
function ReadingTab() {
    const [meterSN, setMeterSN] = useState('');
    const [siteId, setSiteId] = useState<SiteId>('KYAKALE');
    const [operatorId, setOperatorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [task, setTask] = useState<any>(null);
    const pollRef = useRef<ReturnType<typeof setInterval>>();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setTask(null);
        try {
            const result = await operationsApi.createReadingTask(meterSN, siteId, operatorId);
            setTask(result);
            // Start polling
            pollRef.current = setInterval(async () => {
                const updated = await operationsApi.pollTask(result.taskId, siteId);
                if (updated) {
                    setTask(updated);
                    if (updated.status !== 'PENDING') clearInterval(pollRef.current);
                }
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl border border-odyssey-border p-6 space-y-5">
                <h3 className="font-display font-semibold text-white text-lg">Create Reading Task</h3>
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FieldGroup label="Site" htmlFor="reading-site">
                        <select id="reading-site" value={siteId} onChange={e => setSiteId(e.target.value as SiteId)} className="input-field">
                            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Meter Serial Number" htmlFor="reading-meter">
                        <input id="reading-meter" value={meterSN} onChange={e => setMeterSN(e.target.value)} placeholder="e.g. 04041312345" required className="input-field" />
                    </FieldGroup>
                    <FieldGroup label="Operator ID" htmlFor="reading-operator">
                        <input id="reading-operator" value={operatorId} onChange={e => setOperatorId(e.target.value)} placeholder="Your operator ID" required className="input-field" />
                    </FieldGroup>
                    <button type="submit" disabled={loading || !meterSN || !operatorId} className="btn-primary w-full">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Radio className="w-4 h-4" /> Create Reading Task</>}
                    </button>
                </form>
            </div>

            {/* Result panel */}
            <div className="glass rounded-xl border border-odyssey-border p-6 space-y-4">
                <h3 className="font-display font-semibold text-white text-lg">Task Result</h3>
                {!task ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <Radio className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm">Submit a reading task to see results here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-muted-foreground">Task #{task.taskId}</span>
                            <StatusBadge status={task.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoCell label="Meter" value={task.meterSN} />
                            <InfoCell label="Site" value={task.siteId} />
                            <InfoCell label="Created" value={new Date(task.createdAt).toLocaleTimeString()} />
                            <InfoCell label="Completed" value={task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : '—'} />
                        </div>
                        {task.result && (
                            <pre className="text-xs text-muted-foreground bg-odyssey-deep/60 rounded-lg p-3 overflow-auto max-h-48 font-mono">
                                {JSON.stringify(task.result, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── METER CONTROL TAB (dual-auth) ────────────────────────────
function ControlTab() {
    const [meterSN, setMeterSN] = useState('');
    const [siteId, setSiteId] = useState<SiteId>('KYAKALE');
    const [controlType, setControlType] = useState<'CONNECT' | 'DISCONNECT'>('CONNECT');
    const [reason, setReason] = useState('');
    const [authorizedBy, setAuthorizedBy] = useState('');
    const [secondAuthorizer, setSecondAuthorizer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isDisconnect = controlType === 'DISCONNECT';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const task = await operationsApi.createControlTask({
                meterSN, siteId, controlType, reason, authorizedBy, secondAuthorizer,
            });
            setSuccess(`Control task created: ${task.taskId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass rounded-xl border border-odyssey-border p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <h3 className="font-display font-semibold text-white text-lg">Meter Control Task</h3>
                    {isDisconnect && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                            <Shield className="w-3 h-3" /> Dual Auth Required
                        </span>
                    )}
                </div>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FieldGroup label="Site" htmlFor="ctrl-site">
                            <select id="ctrl-site" value={siteId} onChange={e => setSiteId(e.target.value as SiteId)} className="input-field">
                                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Control Type" htmlFor="ctrl-type">
                            <select id="ctrl-type" value={controlType} onChange={e => setControlType(e.target.value as 'CONNECT' | 'DISCONNECT')} className="input-field">
                                <option value="CONNECT">Connect</option>
                                <option value="DISCONNECT">Disconnect</option>
                            </select>
                        </FieldGroup>
                    </div>
                    <FieldGroup label="Meter Serial Number" htmlFor="ctrl-meter">
                        <input id="ctrl-meter" value={meterSN} onChange={e => setMeterSN(e.target.value)} placeholder="e.g. 04041312345" required className="input-field" />
                    </FieldGroup>
                    <FieldGroup label="Reason" htmlFor="ctrl-reason">
                        <input id="ctrl-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for this operation" required className="input-field" />
                    </FieldGroup>
                    <FieldGroup label="Authorized By (Operator 1)" htmlFor="ctrl-auth1">
                        <input id="ctrl-auth1" value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)} placeholder="Primary operator ID" required className="input-field" />
                    </FieldGroup>

                    {isDisconnect && (
                        <FieldGroup label="Second Authorizer (Operator 2) — Required for Disconnect" htmlFor="ctrl-auth2">
                            <input id="ctrl-auth2" value={secondAuthorizer} onChange={e => setSecondAuthorizer(e.target.value)} placeholder="Second operator ID (four-eyes principle)" required className="input-field" />
                        </FieldGroup>
                    )}

                    <button type="submit" disabled={loading || !meterSN || !reason || !authorizedBy || (isDisconnect && !secondAuthorizer)} className={cn('btn-primary w-full', isDisconnect && 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25')}>
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : (
                            isDisconnect ? <><WifiOff className="w-4 h-4" /> Disconnect Meter</> : <><Wifi className="w-4 h-4" /> Connect Meter</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── REMOTE TOKEN TAB ─────────────────────────────────────────
function TokenDeliveryTab() {
    const [meterSN, setMeterSN] = useState('');
    const [siteId, setSiteId] = useState<SiteId>('KYAKALE');
    const [tokenValue, setTokenValue] = useState('');
    const [operatorId, setOperatorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const task = await operationsApi.createTokenTask(meterSN, siteId, tokenValue, operatorId);
            setSuccess(`Token delivery task created: ${task.taskId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass rounded-xl border border-odyssey-border p-6 space-y-5">
                <h3 className="font-display font-semibold text-white text-lg">Remote Token Delivery</h3>
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FieldGroup label="Site" htmlFor="tok-site">
                            <select id="tok-site" value={siteId} onChange={e => setSiteId(e.target.value as SiteId)} className="input-field">
                                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Operator ID" htmlFor="tok-op">
                            <input id="tok-op" value={operatorId} onChange={e => setOperatorId(e.target.value)} placeholder="Your operator ID" required className="input-field" />
                        </FieldGroup>
                    </div>
                    <FieldGroup label="Meter Serial Number" htmlFor="tok-meter">
                        <input id="tok-meter" value={meterSN} onChange={e => setMeterSN(e.target.value)} placeholder="e.g. 04041312345" required className="input-field" />
                    </FieldGroup>
                    <FieldGroup label="Token Value (20 digits)" htmlFor="tok-value">
                        <input id="tok-value" value={tokenValue} onChange={e => setTokenValue(e.target.value.replace(/\D/g, '').slice(0, 20))} placeholder="20-digit STS token" required maxLength={20} className="input-field font-mono tracking-wider" />
                        <p className="text-xs text-muted-foreground mt-1">{tokenValue.length}/20 digits</p>
                    </FieldGroup>
                    <button type="submit" disabled={loading || !meterSN || tokenValue.length !== 20 || !operatorId} className="btn-primary w-full">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Delivering...</> : <><Send className="w-4 h-4" /> Deliver Token</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── TASK MONITOR TAB ─────────────────────────────────────────
function MonitorTab() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [siteFilter, setSiteFilter] = useState<SiteId | ''>('');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await operationsApi.listTasks(siteFilter as SiteId || undefined);
            setTasks(data);
        } catch { } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, [siteFilter]);

    // Auto-refresh every 5s
    useEffect(() => {
        const int = setInterval(fetchTasks, 5000);
        return () => clearInterval(int);
    }, [siteFilter]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <select value={siteFilter} onChange={e => setSiteFilter(e.target.value as SiteId | '')} className="input-field w-auto min-w-[140px]">
                        <option value="">All Sites</option>
                        {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-odyssey-electric animate-pulse" />
                        Auto-refreshing
                    </div>
                </div>
                <button onClick={fetchTasks} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-odyssey-border/50 transition-all">
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
                </button>
            </div>

            <div className="glass rounded-xl border border-odyssey-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-odyssey-border text-muted-foreground text-left">
                                <th className="px-4 py-3 font-medium">Task ID</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Meter</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium">By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 && !loading && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No tasks found</td></tr>
                            )}
                            {tasks.map((task, i) => (
                                <tr key={task.taskId + i} className="border-b border-odyssey-border/50 hover:bg-odyssey-border/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-odyssey-accent">{task.taskId}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded bg-odyssey-blue/20 text-xs font-medium text-white">{task.taskType}</span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-white">{task.meterSN}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{task.siteId}</td>
                                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{task.createdBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── SHARED COMPONENTS ────────────────────────────────────────
function FieldGroup({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground">{label}</label>
            {children}
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="glass rounded-lg p-3 border border-odyssey-border/50">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm text-white font-mono mt-0.5">{value}</p>
        </div>
    );
}

// ── MAIN PAGE ────────────────────────────────────────────────
export function OperationsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('reading');
    const active = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white tracking-tight">Remote Operations</h1>
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
            {activeTab === 'reading' && <ReadingTab />}
            {activeTab === 'control' && <ControlTab />}
            {activeTab === 'token' && <TokenDeliveryTab />}
            {activeTab === 'monitor' && <MonitorTab />}
        </div>
    );
}
