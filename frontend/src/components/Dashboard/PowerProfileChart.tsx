import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '../../lib/utils';

interface PowerProfileChartProps {
    data?: any[];
    className?: string;
}

export function PowerProfileChart({ data, className }: PowerProfileChartProps) {
    const chartData = data || [];

    return (
        <div className={cn("bg-slate-900/40 p-6 rounded-3xl border border-white/5", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-bold text-white">Power Profile</h3>
                    <p className="text-xs text-muted-foreground">24-hour generation & consumption</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-colors uppercase">
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            interval={2}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            unit=" kW"
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            formatter={(val) => <span className="text-[10px] font-bold text-muted-foreground uppercase">{val}</span>}
                        />

                        <Area
                            type="monotone"
                            dataKey="pv"
                            name="Solar Production"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPv)"
                        />
                        <Area
                            type="monotone"
                            dataKey="load"
                            name="Power Consumption"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorLoad)"
                        />
                        <Area
                            type="monotone"
                            dataKey="grid"
                            name="Grid Interaction"
                            stroke="#a855f7"
                            strokeWidth={1}
                            fillOpacity={1}
                            fill="url(#colorGrid)"
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
