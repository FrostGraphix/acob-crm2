import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit3, ShieldAlert, Key } from 'lucide-react';
import { apiClient } from '../../services/api';
import { cn } from '../../lib/utils';

export function UserManagementPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>('/settings/users');
      setData(resp.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage administrative access and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-odyssey-electric text-odyssey-card font-bold text-sm shadow-lg hover:shadow-odyssey-electric/20 transition-all">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="glass rounded-2xl border border-odyssey-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4"><input type="checkbox" readOnly /></th>
                <th className="px-6 py-4">Operator Id</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Create Time</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={8} className="px-6 py-4"><div className="h-4 bg-white/5 rounded" /></td></tr>)
              ) : data.length > 0 ? (
                data.map((user, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4"><input type="checkbox" readOnly /></td>
                    <td className="px-6 py-4 font-mono text-odyssey-electric text-xs">{user.id || 'OP-00' + i}</td>
                    <td className="px-6 py-4 font-bold text-white">{user.username}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{user.name || 'Administrator'}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-odyssey-blue/10 text-odyssey-blue text-[10px] font-bold border border-odyssey-blue/20 capitalize">{user.role || 'Admin'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] text-green-500 font-bold uppercase">Active</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button title="Edit" className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-odyssey-electric"><Edit3 className="w-4 h-4" /></button>
                        <button title="Reset Password" className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-odyssey-blue"><Key className="w-4 h-4" /></button>
                        <button title="Permissions" className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-orange-400"><ShieldAlert className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">No users found</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
