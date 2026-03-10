import React from 'react';
import { motion } from 'framer-motion';
import {
    Sun, Battery, Home, Zap,
    Activity
} from 'lucide-react';
import { FlowMetrics } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

interface FlowGraphProps {
    metrics?: FlowMetrics;
    className?: string;
}

export function FlowGraph({ metrics, className }: FlowGraphProps) {
    const m = metrics || {
        solarToInverterKw: 0,
        inverterToBatteryKw: 0,
        batteryToInverterKw: 0,
        inverterToLoadKw: 0,
        gridToInverterKw: 0,
        inverterToGridKw: 0,
        generatorToInverterKw: 0,
    };

    const isCharging = m.inverterToBatteryKw > 0;
    const isBatteryDischarging = m.batteryToInverterKw > 0;
    const isGridImporting = m.gridToInverterKw > 0;
    const isGridExporting = m.inverterToGridKw > 0;

    return (
        <div className={cn("relative w-full aspect-[16/9] bg-slate-900/40 rounded-3xl border border-white/5 p-8 overflow-hidden", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05),transparent)] pointer-events-none" />

            <div className="relative w-full h-full grid grid-cols-3 grid-rows-3 gap-4 items-center justify-center">
                {/* TOP LEFT: SOLAR */}
                <div className="flex flex-col items-center justify-self-start self-start space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <Sun size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">Solar PV</p>
                        <p className="text-xl font-display font-bold text-white leading-tight">{m.solarToInverterKw.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
                    </div>
                </div>

                {/* TOP RIGHT: LOAD */}
                <div className="col-start-3 flex flex-col items-center justify-self-end self-start space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Home size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-blue-500/60 uppercase tracking-widest font-bold">Property Load</p>
                        <p className="text-xl font-display font-bold text-white leading-tight">{m.inverterToLoadKw.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
                    </div>
                </div>

                {/* CENTER: INVERTER */}
                <div className="col-start-2 row-start-2 flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
                        <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-primary/40 flex flex-col items-center justify-center text-primary shadow-xl relative z-10 overflow-hidden">
                            <Zap size={40} className="mb-1" />
                            <span className="text-[10px] uppercase font-black tracking-tighter">Inverter</span>
                            <div className="absolute bottom-0 w-full h-1 bg-primary/20">
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-1/2 h-full bg-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM LEFT: BATTERY */}
                <div className="row-start-3 flex flex-col items-center justify-self-start self-end space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Battery size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-bold">Battery Storage</p>
                        <p className="text-xl font-display font-bold text-white leading-tight">
                            {(isCharging ? m.inverterToBatteryKw : m.batteryToInverterKw).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kW</span>
                        </p>
                    </div>
                </div>

                {/* BOTTOM RIGHT: GRID */}
                <div className="col-start-3 row-start-3 flex flex-col items-center justify-self-end self-end space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <Activity size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-purple-500/60 uppercase tracking-widest font-bold">Utility Grid</p>
                        <p className="text-xl font-display font-bold text-white leading-tight">
                            {(isGridImporting ? m.gridToInverterKw : m.inverterToGridKw).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kW</span>
                        </p>
                    </div>
                </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <FlowPath
                    id="pv-inv"
                    active={m.solarToInverterKw > 0}
                    points="20%,20% 50%,50%"
                    color="#f59e0b"
                    speed={m.solarToInverterKw}
                />
                <FlowPath
                    id="inv-load"
                    active={m.inverterToLoadKw > 0}
                    points="50%,50% 80%,20%"
                    color="#3b82f6"
                    speed={m.inverterToLoadKw}
                />
                <FlowPath
                    id="inv-batt"
                    active={isCharging || isBatteryDischarging}
                    points={isCharging ? "50%,50% 20%,80%" : "20%,80% 50%,50%"}
                    color="#10b981"
                    speed={isCharging ? m.inverterToBatteryKw : m.batteryToInverterKw}
                />
                <FlowPath
                    id="inv-grid"
                    active={isGridImporting || isGridExporting}
                    points={isGridImporting ? "80%,80% 50%,50%" : "50%,50% 80%,80%"}
                    color="#a855f7"
                    speed={isGridImporting ? m.gridToInverterKw : m.inverterToGridKw}
                />
            </svg>
        </div>
    );
}

function FlowPath({ active, points, color, speed }: { id: string, active: boolean, points: string, color: string, speed: number }) {
    if (!active) return null;
    const duration = Math.max(0.5, 3 - (speed / 50));
    return (
        <>
            <path
                d={`M ${points.replace(/%/g, ' ')}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4 8"
                className="opacity-20"
            />
            <motion.circle r="4" fill={color} filter="url(#glow)">
                <animateMotion
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    path={`M ${points.replace(/%/g, ' ')}`}
                />
            </motion.circle>
        </>
    );
}
