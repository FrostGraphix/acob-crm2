import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { SchemaViewer } from '../components/SchemaViewer';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export function DiagnosticsPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runDiagnostics = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.getDiagnostics();
            setResults(data.results || []);
        } catch (err: any) {
            setError(err.message || 'Failed to run diagnostics');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">API Diagnostics & Health</h1>
                <p className="text-neutral-400">
                    Run automated probes against the Odyssey vendor API to detect unannounced schema changes or 404 endpoint breakages.
                </p>
            </header>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Manual Health Probe</h2>
                        <p className="text-sm text-neutral-400">Force trigger the API health checks instead of waiting for the cron job.</p>
                    </div>
                    <button
                        onClick={runDiagnostics}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Probing...' : 'Run Diagnostics'}
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {results && (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-lg font-medium text-white mb-4">Probe Results</h3>
                        {results.length === 0 ? (
                            <p className="text-neutral-400">No results returned from the probe.</p>
                        ) : (
                            <div className="grid gap-6">
                                {results.map((res: any, idx: number) => (
                                    <div key={idx} className={`p-5 rounded-lg border ${res.status === 'OK' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                                        }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {res.status === 'OK' ? (
                                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                                )}
                                                <h4 className="font-mono text-sm font-semibold text-white">{res.endpoint}</h4>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${res.status === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {res.status} {res.statusCode ? `(${res.statusCode})` : ''}
                                            </span>
                                        </div>

                                        {res.message && (
                                            <p className="text-sm text-red-300 mb-4">{res.message}</p>
                                        )}

                                        {res.status === 'OK' && (
                                            <div>
                                                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2 font-semibold">Detected Schema Keys</p>
                                                <SchemaViewer data={res.schema} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
