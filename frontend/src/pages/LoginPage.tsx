// ============================================================
// /frontend/src/pages/LoginPage.tsx
// Full-screen glassmorphic login page with premium animations
// ============================================================
import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Radio, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const SITES = [
    { id: 'KYAKALE', color: '#06D6A0' },
    { id: 'MUSHA', color: '#00B4D8' },
    { id: 'UMAISHA', color: '#FFB703' },
    { id: 'TUNGA', color: '#FB8500' },
    { id: 'OGUFA', color: '#EF4444' },
];

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            const redirect = searchParams.get('redirect') || '/dashboard';
            navigate(redirect, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.error ?? err.message ?? 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-odyssey-accent/10 blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        x: [0, -100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-odyssey-electric/10 blur-[120px]"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-grid-pattern opacity-[0.03]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
            </div>

            {/* Login card */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-md z-10"
            >
                <div className="glass rounded-[2rem] border border-white/10 p-8 md:p-10 shadow-2xl backdrop-blur-3xl overflow-hidden group">
                    {/* Decorative subtle border glow */}
                    <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none" />

                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center space-y-4 mb-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-odyssey-accent to-odyssey-electric flex items-center justify-center blue-glow shadow-[0_0_30px_rgba(0,180,216,0.3)]"
                        >
                            <Radio className="w-8 h-8 text-[#020617]" />
                        </motion.div>
                        <div className="space-y-1">
                            <h1 className="font-display font-bold text-3xl text-white tracking-tight">ACOB Odyssey</h1>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-odyssey-accent/50" />
                                <span className="text-odyssey-accent text-xs font-bold uppercase tracking-[0.2em]">Metering Elite</span>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-odyssey-accent/50" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Site Status Map-style Indicators */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-y-3 gap-x-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 mb-8">
                        {SITES.map(site => (
                            <div key={site.id} className="flex items-center gap-2" title={`${site.id} Active`}>
                                <div className="relative">
                                    <div className="w-1.5 h-1.5 rounded-full z-10 relative" style={{ backgroundColor: site.color }} />
                                    <div
                                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                                        style={{ backgroundColor: site.color }}
                                    />
                                </div>
                                <span className="text-[10px] text-white/50 font-mono font-medium">{site.id}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Error Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label htmlFor="login-username" className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
                                Identity
                            </label>
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Operator Username"
                                autoComplete="username"
                                autoFocus
                                required
                                className="w-full h-12 px-5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-odyssey-accent/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-odyssey-accent/5 transition-all outline-none"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label htmlFor="login-password" className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
                                Authorization
                            </label>
                            <div className="relative group/pass">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Access Code"
                                    autoComplete="current-password"
                                    required
                                    className="w-full h-12 px-5 pr-12 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-odyssey-accent/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-odyssey-accent/5 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-between pb-2">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={e => setRemember(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 rounded-md border border-white/10 bg-white/[0.03] transition-all peer-checked:bg-odyssey-accent peer-checked:border-odyssey-accent group-hover/check:border-white/30" />
                                    <svg className="absolute w-3 h-3 text-[#020617] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span className="text-sm text-white/40 group-hover/check:text-white/70 transition-colors font-medium">
                                    Trust this device
                                </span>
                            </label>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(0, 180, 216, 0.3)" }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !username || !password}
                            className={cn(
                                'w-full h-12 px-8 rounded-xl font-bold text-sm tracking-wide transition-all uppercase',
                                'bg-gradient-to-r from-odyssey-accent to-odyssey-electric text-[#020617] shadow-xl',
                                'flex items-center justify-center gap-2 group/btn',
                                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none'
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Access System</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Developer Doorbell */}
                    <motion.div variants={itemVariants} className="pt-8 text-center">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-odyssey-accent shadow-[0_0_8px_rgba(0,180,216,0.6)]" />
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">
                                Dev Access: <span className="text-white/60 ml-1">Use configured backend credentials</span>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Metadata */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="flex flex-col items-center gap-2 mt-10"
                >
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                        Odyssey Command v1.0.42
                    </p>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <p className="text-[9px] text-white/10 max-w-[200px] text-center italic">
                        Secured terminal for ACOB authorized operators only.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}

