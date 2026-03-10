import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '../../lib/utils';

interface GenerationUsageChartProps {
    data?: any[];
    className?: string;
}

export function GenerationUsageChart({ data, className }: GenerationUsageChartProps) {
    const chartData = data || [];

    return (
        <div className={cn("bg-slate-900/40 p-6 rounded-3xl border border-white/5", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-bold text-white">Generation & Usage</h3>
                    <p className="text-xs text-muted-foreground">Daily historical energy stats</p>
                </div>
            </div>

            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            unit=" kWh"
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px' }}
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            formatter={(val) => <span className="text-[10px] font-bold text-muted-foreground uppercase">{val}</span>}
                        />

                        <Bar
                            dataKey="pv"
                            name="Solar Production"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="load"
                            name="Consumption"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
