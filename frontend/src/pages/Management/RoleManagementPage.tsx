import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, CheckCircle2, Search, UserPlus } from 'lucide-react';
import { apiClient } from '../../services/api';
import { SITES } from '@common/types/odyssey';
import { cn } from '../../lib/utils';

export function RoleManagementPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/settings/roles');
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Define system roles and granular access permissions</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-odyssey-electric text-odyssey-card font-bold text-sm shadow-lg transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="glass h-48 rounded-2xl animate-pulse bg-white/5" />)
        ) : data.length > 0 ? (
          data.map((role, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-odyssey-border/50 hover:bg-white/5 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-odyssey-blue/10 text-odyssey-blue">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{role.description || 'Access control profile for ' + role.name}</p>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-odyssey-electric bg-odyssey-electric/5 p-2 rounded-lg w-fit">
                <CheckCircle2 className="w-3 h-3" /> System Role
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full glass p-12 text-center rounded-2xl border border-odyssey-border italic text-muted-foreground">No roles defined</div>
        )}
      </div>
    </div>
  );
}
