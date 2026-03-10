import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GenerationStats } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

interface UtilizationPiesProps {
    stats?: GenerationStats;
    className?: string;
}

export function UtilizationPies({ stats, className }: UtilizationPiesProps) {
    const s = stats || {
        pvYield: 0,
        loadConsumption: 0,
        gridImport: 0,
        gridExport: 0,
        batteryDischarge: 0,
        batteryCharge: 0,
    };

    const consumptionData = [
        { name: 'Solar', value: Math.max(0, s.loadConsumption - s.gridImport - s.batteryDischarge), color: '#f59e0b' },
        { name: 'Battery', value: s.batteryDischarge, color: '#10b981' },
        { name: 'Grid', value: s.gridImport, color: '#a855f7' },
    ].filter(d => d.value > 0);

    const productionData = [
        { name: 'Consumed', value: Math.max(0, s.pvYield - s.gridExport - s.batteryCharge), color: '#3b82f6' },
        { name: 'Storage', value: s.batteryCharge, color: '#10b981' },
        { name: 'Export', value: s.gridExport, color: '#64748b' },
    ].filter(d => d.value > 0);

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
            {/* Consumption Breakdown */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Consumption Source</h3>
                <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={consumptionData}
                                cx="50%"
                                cy="75%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {consumptionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-end pointer-events-none">
                        <span className="text-2xl font-display font-bold text-white leading-none mb-1">{Math.round(s.loadConsumption)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">kWh Total</span>
                    </div>
                </div>
                <div className="flex gap-4 mt-2 flex-wrap justify-center">
                    {consumptionData.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5 min-w-[80px]">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold leading-tight">{d.name}</span>
                                <span className="text-xs text-white font-medium">{Math.round(d.value)} <span className="text-[9px] text-white/50">kWh</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Production Breakdown */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Solar Utilization</h3>
                <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={productionData}
                                cx="50%"
                                cy="75%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {productionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-end pointer-events-none">
                        <span className="text-2xl font-display font-bold text-white leading-none mb-1">{Math.round(s.pvYield)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">kWh Yield</span>
                    </div>
                </div>
                <div className="flex gap-4 mt-4 flex-wrap justify-center">
                    {productionData.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
