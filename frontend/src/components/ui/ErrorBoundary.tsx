import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-odyssey-surface flex items-center justify-center p-6">
                    <div className="glass max-w-lg w-full p-8 rounded-2xl border border-red-500/20 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="font-display font-bold text-2xl text-white mb-2">Something went wrong</h1>
                        <p className="text-muted-foreground text-sm mb-6">
                            The application encountered an unexpected error during rendering. This has been logged for review.
                        </p>

                        {this.state.error && (
                            <div className="mb-8 p-4 bg-black/40 rounded-xl border border-white/5 text-left">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 font-mono">Error Details</p>
                                <p className="text-xs text-red-400 font-mono break-all">{this.state.error.message}</p>
                                {this.state.error.stack && (
                                    <p className="text-[10px] text-white/20 font-mono mt-2 overflow-hidden h-20 overflow-y-auto scrollbar-thin">
                                        {this.state.error.stack}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Reload Page</span>
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="w-full px-4 py-2.5 rounded-lg border border-odyssey-border text-white text-sm font-medium hover:bg-odyssey-border/40 transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                <span>Return to Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
