// ============================================================
// /frontend/src/pages/TokensPage.tsx
// Full token management — generate, view records, filter by site
// ============================================================
import { useState, useMemo, useEffect } from 'react';
import {
  Zap, Search, Filter, Download, Plus, Copy,
  CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, ShieldCheck, CreditCard,
  RefreshCw
} from 'lucide-react';
import { useTokenRecords } from '../hooks/useOdyssey';
import { apiClient } from '../services/api';
import { meterApi, type Meter } from '../services/management-api';
import { SITES, type SiteId } from '@common/types/odyssey';
import { formatCurrency, formatNumber, SITE_COLORS } from '../lib/utils';
import { DateRangePicker, DatePresets } from '../components/ui/DateRangePicker';

const TOKEN_TYPES = [
  { id: 'credit', label: 'Credit Token', description: 'Load prepaid electricity credit onto meter', color: '#06D6A0' },
  { id: 'clear-tamper', label: 'Clear Tamper', description: 'Clear tamper flag after investigation', color: '#00B4D8' },
  { id: 'clear-credit', label: 'Clear Credit', description: 'Remove stored credit from meter', color: '#FFB703' },
  { id: 'max-power', label: 'Max Power Limit', description: 'Set maximum power draw limit', color: '#FB8500' },
];

interface GenerateFormState {
  tokenType: string;
  siteId: SiteId;
  meterSN: string;
  amount: string;
  tariffRate: string;
  limitKw: string;
  operatorId: string;
}

const INITIAL_FORM: GenerateFormState = {
  tokenType: 'credit',
  siteId: 'KYAKALE',
  meterSN: '',
  amount: '',
  tariffRate: '25',
  limitKw: '5',
  operatorId: '',
};

const DEFAULT_FROM = '2025-01-01T00:00:00.000Z';

export function TokensPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(new Date().toISOString());
  const [filterSite, setFilterSite] = useState<SiteId | 'ALL'>('ALL');
  const [searchMeter, setSearchMeter] = useState('');
  const [form, setForm] = useState<GenerateFormState>(INITIAL_FORM);
  const [generating, setGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Meter dropdown state
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loadingMeters, setLoadingMeters] = useState(false);

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  const { data: records, loading, refetch } = useTokenRecords(filterSite, from, to);

  const filtered = useMemo(() => {
    if (!records) return [];
    if (!searchMeter) return records;
    return records.filter(r =>
      r.meterSN?.toLowerCase().includes(searchMeter.toLowerCase())
    );
  }, [records, searchMeter]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchMeter, filterSite, from, to]);

  // Load meters for the dropdown when siteId changes in wizard step 2
  useEffect(() => {
    if (!showWizard || wizardStep !== 2) return;

    async function loadMeters() {
      setLoadingMeters(true);
      try {
        const res = await meterApi.list(form.siteId);
        setMeters(res);
        if (res.length > 0) {
          if (!form.meterSN || !res.some(m => m.meterSN === form.meterSN)) {
            setForm(f => ({ ...f, meterSN: res[0].meterSN }));
          }
        } else {
          setForm(f => ({ ...f, meterSN: '' }));
        }
      } catch (err) {
        console.error('Failed to fetch meters', err);
      } finally {
        setLoadingMeters(false);
      }
    }
    loadMeters();
  }, [form.siteId, showWizard, wizardStep]);

  const handleNextStep = () => {
    setFormError(null);
    if (wizardStep === 2) {
      if (!form.meterSN.trim()) return setFormError('Meter serial number is required');
      if (!form.operatorId.trim()) return setFormError('Operator ID is required');
      if (form.tokenType === 'credit' && !form.amount) return setFormError('Amount is required');
    }
    setWizardStep((s) => Math.min(s + 1, 4) as any);
  };

  const handlePrevStep = () => {
    setFormError(null);
    setWizardStep((s) => Math.max(s - 1, 1) as any);
  };

  async function handleGenerate() {
    setFormError(null);
    try {
      setGenerating(true);
      let result: any;

      if (form.tokenType === 'credit') {
        result = await apiClient.generateCreditToken({
          meterSN: form.meterSN,
          amount: parseFloat(form.amount),
          tariffRate: parseFloat(form.tariffRate),
          siteId: form.siteId,
          operatorId: form.operatorId,
        });
        setGeneratedToken(result.tokenValue);
      } else if (form.tokenType === 'clear-tamper') {
        result = await apiClient.generateClearTamperToken(form.meterSN, form.siteId, form.operatorId);
        setGeneratedToken(result?.TokenValue ?? result?.tokenValue ?? 'Generated');
      } else if (form.tokenType === 'clear-credit') {
        result = await apiClient.generateClearCreditToken(form.meterSN, form.siteId, form.operatorId);
        setGeneratedToken(result?.TokenValue ?? result?.tokenValue ?? 'Generated');
      } else if (form.tokenType === 'max-power') {
        result = await apiClient.generateMaxPowerToken(
          form.meterSN, form.siteId, parseFloat(form.limitKw), form.operatorId
        );
        setGeneratedToken(result?.TokenValue ?? result?.tokenValue ?? 'Generated');
      }

      setWizardStep(4);
      await refetch();
    } catch (err: any) {
      setFormError(err.message ?? 'Token generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToken() {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setGeneratedToken(null);
    setFormError(null);
  };

  const totalRevenue = filtered.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalTokens = filtered.length;
  const totalEnergy = filtered.reduce((s, r) => s + (r.kwh ?? r.energyUnits ?? 0), 0);
  const uniqueMeters = new Set(filtered.map(r => r.meterSN)).size;

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Token Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate STS tokens · View records · All 5 sites
          </p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-odyssey-electric text-odyssey-surface font-semibold text-sm hover:opacity-90 transition-all electric-glow"
          >
            <Plus className="w-4 h-4" />
            Generate Token
          </button>
        )}
      </div>

      {/* Token Statistics Dashboard */}
      {!showWizard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {[
            { label: 'Total Tokens', value: formatNumber(totalTokens), subtext: 'Generated in period', icon: <Zap className="w-5 h-5 text-[#06D6A0]" />, bgColor: 'bg-[#06D6A0]/10', borderColor: 'border-[#06D6A0]/20' },
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), subtext: 'In selected period', icon: <CreditCard className="w-5 h-5 text-blue-400" />, bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
            { label: 'Energy Dispensed', value: `${formatNumber(totalEnergy)} kWh`, subtext: 'Total allocated', icon: <RefreshCw className="w-5 h-5 text-purple-400" />, bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20' },
            { label: 'Unique Meters', value: formatNumber(uniqueMeters), subtext: 'Receiving tokens', icon: <ShieldCheck className="w-5 h-5 text-orange-400" />, bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/20' },
          ].map((stat, i) => (
            <div key={i} className={`glass border border-odyssey-border rounded-xl p-5 flex items-start justify-between hover:border-odyssey-mid/50 transition-colors`}>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                <h4 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">{stat.value}</h4>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor} border ${stat.borderColor}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Token Wizard UI */}
      {showWizard && (
        <div className="glass rounded-xl border border-odyssey-electric/40 p-6 sm:p-8 animate-fade-in relative overflow-hidden shadow-[0_0_40px_-15px_rgba(6,214,160,0.2)]">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-odyssey-border/50">
            <div
              className="h-full bg-odyssey-electric transition-all duration-500 ease-in-out"
              style={{ width: `${(wizardStep / 4) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between mb-8 mt-2">
            <div>
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-odyssey-electric" />
                Token Generation Wizard
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {wizardStep === 1 && "Step 1: Select the type of token you want to generate."}
                {wizardStep === 2 && "Step 2: Provide meter details and generation parameters."}
                {wizardStep === 3 && "Step 3: Review the details before final generation."}
                {wizardStep === 4 && "Step 4: Token generated successfully."}
              </p>
            </div>
            <button onClick={closeWizard} className="text-muted-foreground hover:text-white text-sm px-3 py-1 rounded-md hover:bg-white/5 transition-colors">
              ✕ Close
            </button>
          </div>

          <div className="min-h-[300px]">
            {/* Step 1: Token Type */}
            {wizardStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {TOKEN_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setForm(f => ({ ...f, tokenType: type.id })); handleNextStep(); }}
                    className={`glass rounded-xl p-5 border text-left transition-all hover:-translate-y-1 ${form.tokenType === type.id
                      ? 'border-odyssey-electric bg-odyssey-electric/5 ring-1 ring-odyssey-electric/20 shadow-[0_0_20px_-5px_rgba(6,214,160,0.15)]'
                      : 'border-odyssey-border hover:border-odyssey-mid/60'
                      }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                      style={{ backgroundColor: `${type.color}15`, color: type.color }}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white mb-1.5">{type.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Details */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Site */}
                  <div>
                    <label className="text-sm text-muted-foreground font-medium block mb-2">Target Site</label>
                    <div className="relative">
                      <select
                        value={form.siteId}
                        onChange={e => setForm(f => ({ ...f, siteId: e.target.value as SiteId }))}
                        className="w-full glass border border-odyssey-border rounded-xl px-4 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 appearance-none"
                      >
                        {SITES.map(s => <option key={s} value={s} className="bg-odyssey-card">{s}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Meter SN dropdown */}
                  <div>
                    <label className="text-sm text-muted-foreground font-medium block mb-2">Target Meter (Serial No. + Name)</label>
                    <div className="relative">
                      {loadingMeters ? (
                        <div className="w-full glass border border-odyssey-border rounded-xl px-4 py-3 h-[46px] flex items-center">
                          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading meters...</span>
                        </div>
                      ) : (
                        <>
                          <select
                            value={form.meterSN}
                            onChange={e => setForm(f => ({ ...f, meterSN: e.target.value }))}
                            className="w-full glass border border-odyssey-border rounded-xl pl-4 pr-10 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 appearance-none font-mono"
                          >
                            <option value="" disabled className="bg-odyssey-card">Select a meter...</option>
                            {meters.map(m => (
                              <option key={m.meterSN} value={m.meterSN} className="bg-odyssey-card">
                                {m.meterSN} — {m.customerName || 'Unknown Customer'}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount — credit token only */}
                  {form.tokenType === 'credit' && (
                    <>
                      <div>
                        <label className="text-sm text-muted-foreground font-medium block mb-2">Amount (₦)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                          <input
                            type="number"
                            placeholder="5000"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full glass border border-odyssey-border rounded-xl pl-9 pr-4 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 placeholder:text-muted-foreground/30 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground font-medium block mb-2">Tariff Rate (₦/kWh)</label>
                        <input
                          type="number"
                          placeholder="25"
                          value={form.tariffRate}
                          onChange={e => setForm(f => ({ ...f, tariffRate: e.target.value }))}
                          className="w-full glass border border-odyssey-border rounded-xl px-4 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 placeholder:text-muted-foreground/30 font-mono"
                        />
                      </div>
                    </>
                  )}

                  {/* Power limit — max-power token only */}
                  {form.tokenType === 'max-power' && (
                    <div>
                      <label className="text-sm text-muted-foreground font-medium block mb-2">Power Limit (kW)</label>
                      <input
                        type="number"
                        placeholder="5"
                        value={form.limitKw}
                        onChange={e => setForm(f => ({ ...f, limitKw: e.target.value }))}
                        className="w-full glass border border-odyssey-border rounded-xl px-4 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 placeholder:text-muted-foreground/30 font-mono"
                      />
                    </div>
                  )}

                  {/* Operator ID */}
                  <div>
                    <label className="text-sm text-muted-foreground font-medium block mb-2">Operator ID</label>
                    <input
                      type="text"
                      placeholder="Your authorized ID"
                      value={form.operatorId}
                      onChange={e => setForm(f => ({ ...f, operatorId: e.target.value }))}
                      className="w-full glass border border-odyssey-border rounded-xl px-4 py-3 text-sm text-white bg-transparent focus:outline-none focus:border-odyssey-electric/50 focus:ring-1 focus:ring-odyssey-electric/50 placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                {/* Credit amount preview estimation */}
                {form.tokenType === 'credit' && form.amount && form.tariffRate && (
                  <div className="p-4 rounded-xl bg-odyssey-electric/5 border border-odyssey-electric/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-odyssey-electric/20 flex items-center justify-center text-odyssey-electric">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Estimated Energy</p>
                      <p className="text-white font-mono text-lg font-bold">
                        {(parseFloat(form.amount) / parseFloat(form.tariffRate)).toFixed(2)} <span className="text-sm text-muted-foreground">kWh</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-fade-in h-full flex flex-col justify-center">
                <div className="glass rounded-xl border border-odyssey-border p-6 sm:p-8 bg-black/20 backdrop-blur-md">
                  <h3 className="text-lg font-display font-semibold text-white mb-6 border-b border-odyssey-border pb-4 w-full">
                    Confirm Generation
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-odyssey-border/40">
                      <span className="text-muted-foreground font-medium">Type</span>
                      <span className="text-white font-semibold flex items-center gap-2">
                        {TOKEN_TYPES.find(t => t.id === form.tokenType)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-odyssey-border/40">
                      <span className="text-muted-foreground font-medium">Site</span>
                      <span className="text-white font-medium px-2.5 py-1 rounded bg-white/5 border border-white/10">{form.siteId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-odyssey-border/40">
                      <span className="text-muted-foreground font-medium">Meter SN</span>
                      <span className="text-white font-mono tracking-widest">{form.meterSN}</span>
                    </div>

                    {form.tokenType === 'credit' && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-odyssey-border/40">
                          <span className="text-muted-foreground font-medium">Amount</span>
                          <span className="text-odyssey-electric font-semibold text-lg">{formatCurrency(parseFloat(form.amount || '0'))}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-odyssey-border/40">
                          <span className="text-muted-foreground font-medium">Energy Conversion</span>
                          <span className="text-white font-mono">{(parseFloat(form.amount || '0') / parseFloat(form.tariffRate || '1')).toFixed(2)} kWh</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-3 mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-orange-400" />
                      <p>Generating a token will permanently record this transaction. Ensure the meter serial number is exactly correct.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success / STS Card UI */}
            {wizardStep === 4 && generatedToken && (
              <div className="animate-fade-in flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-odyssey-electric/20 flex items-center justify-center mb-6 text-odyssey-electric">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-2">Token Generated</h3>
                <p className="text-muted-foreground mb-8 text-center max-w-sm">
                  The STS token has been successfully generated for meter <span className="font-mono text-white">{form.meterSN}</span>.
                </p>

                {/* STS Card Design */}
                <div className="w-full max-w-md bg-gradient-to-br from-[#1a1c23] to-[#0f1115] rounded-2xl p-6 sm:p-8 border border-[#2a2d35] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#3a3d45] transition-colors">
                  {/* Card Background Accents */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-odyssey-electric/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-[#06D6A0]" />
                      <span className="font-semibold text-white tracking-widest text-sm uppercase opacity-90">STS Token</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground uppercase opacity-70 tracking-widest px-2 py-1 rounded bg-black/30 border border-white/5">
                      {form.siteId}
                    </span>
                  </div>

                  <div className="mb-8 relative z-10">
                    <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold block mb-2 ml-1">Token Code</label>
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-[#2a2d35] group-hover:bg-black/60 transition-colors">
                      <code className="flex-1 font-mono text-xl sm:text-2xl font-bold text-white tracking-[0.2em] break-all leading-relaxed">
                        {/* Format token logic: e.g. 1234 5678 9012 3456 7890 */}
                        {generatedToken.replace(/(.{4})/g, '$1 ').trim()}
                      </code>
                      <button
                        onClick={copyToken}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-odyssey-electric transition-colors focus:ring-2 focus:ring-odyssey-electric"
                        title="Copy Token"
                      >
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1">Target Meter</label>
                      <p className="font-mono text-white/90 text-sm tracking-widest">{form.meterSN}</p>
                    </div>
                    {form.tokenType === 'credit' && (
                      <div className="text-right">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1">Value</label>
                        <p className="font-semibold text-odyssey-electric">{formatCurrency(parseFloat(form.amount))}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => { setForm(INITIAL_FORM); setWizardStep(1); setGeneratedToken(null); }}
                    className="px-6 py-2.5 rounded-lg glass border border-odyssey-border text-sm text-white hover:bg-white/5 transition-all"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={closeWizard}
                    className="px-6 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {formError && wizardStep !== 4 && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-3 animate-fade-in shadow-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{formError}</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {wizardStep < 4 && (
            <div className="mt-8 pt-6 border-t border-odyssey-border flex items-center justify-between">
              <button
                onClick={handlePrevStep}
                disabled={wizardStep === 1 || generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg glass border border-odyssey-border text-sm text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none group"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                Back
              </button>

              {wizardStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-odyssey-electric text-odyssey-surface font-semibold text-sm hover:opacity-90 transition-all electric-glow disabled:opacity-50"
                >
                  {generating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Generate Token</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Records section (hidden while wizard is active on small screens) */}
      <div className={`glass rounded-xl border border-odyssey-border overflow-hidden transition-all duration-300 ${showWizard ? 'opacity-40 blur-[1px] pointer-events-none scale-[0.99]' : ''}`}>
        {/* Table header controls */}
        <div className="px-6 py-4 border-b border-odyssey-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-white">Token Records</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalTokens} records · {formatCurrency(totalRevenue)} total
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
            <DatePresets onSelect={(f, t) => { setFrom(f); setTo(t); }} />
            {/* Site filter */}
            <select
              value={filterSite}
              onChange={e => setFilterSite(e.target.value as SiteId | 'ALL')}
              className="glass border border-odyssey-border rounded-lg px-3 py-2 text-xs text-white bg-transparent focus:outline-none focus:border-odyssey-mid/60"
            >
              <option value="ALL" className="bg-odyssey-card">All Sites</option>
              {SITES.map(s => <option key={s} value={s} className="bg-odyssey-card">{s}</option>)}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search meter SN..."
                value={searchMeter}
                onChange={e => setSearchMeter(e.target.value)}
                className="glass border border-odyssey-border rounded-lg pl-9 pr-3 py-2 text-xs text-white bg-transparent focus:outline-none focus:border-odyssey-mid/60 placeholder:text-muted-foreground/50 w-40"
              />
            </div>

            <button
              onClick={refetch}
              className="p-2 rounded-lg glass border border-odyssey-border hover:border-odyssey-mid/40 transition-all text-white hover:text-odyssey-electric"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 shimmer-bg rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No token records found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                {filterSite !== 'ALL' ? `No data for ${filterSite}` : 'No records for the selected date range'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-odyssey-border">
                  {['Meter SN', 'Site', 'Customer', 'Amount', 'Energy', 'Token', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-odyssey-border/40">
                {paginatedRecords.map((record, i) => {
                  const color = SITE_COLORS[record.siteId] || '#94a3b8';
                  const statusColors: Record<string, string> = {
                    ACTIVE: 'text-[#06D6A0]',
                    USED: 'text-muted-foreground',
                    CANCELLED: 'text-red-400',
                  };
                  return (
                    <tr key={record.id ?? i} className="hover:bg-odyssey-border/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-white font-medium">{record.meterSN}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded font-mono font-medium border border-white/5"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {record.siteId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{record.customerName && record.customerName !== 'N/A' ? record.customerName : '—'}</td>
                      <td className="px-4 py-3.5 text-white font-medium">
                        {formatCurrency(record.amount ?? 0)}
                      </td>
                      <td className="px-4 py-3.5 text-white font-mono">
                        {(record.kwh || record.energyUnits) ? `${formatNumber(record.kwh ?? record.energyUnits ?? 0)} kWh` : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-odyssey-electric tracking-widest font-semibold flex items-center gap-2">
                        {record.tokenValue
                          ? <>
                            {record.tokenValue.replace(/\s/g, '').slice(0, 4)} <span className="text-muted-foreground/40 font-normal tracking-tight flex items-center">········</span> {record.tokenValue.replace(/\s/g, '').slice(-4)}
                          </>
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        {record.tokenValue ? (
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-[#06D6A0]/10 text-[#06D6A0] border border-[#06D6A0]/20`}>
                            ACTIVE
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-odyssey-border/50 text-muted-foreground border border-odyssey-border`}>
                            UNKNOWN
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground font-mono whitespace-nowrap">
                        {record.timestamp
                          ? new Date(record.timestamp).toLocaleString()
                          : '—'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-odyssey-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-white/5 border border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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
    </div>
  );
}
