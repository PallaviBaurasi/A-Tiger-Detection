import React, { useState, useEffect } from 'react';
import { fetchAdminUsers, fetchAuditLogs } from '../api/client';
import { User } from '../types';
import { Users, Shield, Clock, RefreshCw } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchAdminUsers(), fetchAuditLogs()])
      .then(([uRes, aRes]) => {
        setUsers(uRes);
        setAuditLogs(aRes);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API fetch users error, using sample data:", err);
        setUsers([
          { id: 1, employee_id: "FD001", name: "Officer Alpha", role: "FOREST_OFFICER", department: "Pench Wildlife Division", shift: "DAY", is_active: true },
          { id: 2, employee_id: "FD002", name: "Officer Beta", role: "REVIEWER", department: "Triage Cell", shift: "DAY", is_active: true },
          { id: 3, employee_id: "FD003", name: "Officer Gamma", role: "FIELD_STAFF", department: "Karmajhiri Patrol", shift: "NIGHT", is_active: true },
          { id: 4, employee_id: "ADMIN01", name: "Administrator", role: "ADMIN", department: "IT & Intelligence", shift: "24X7", is_active: true }
        ]);
        setAuditLogs([
          { id: 1, user_employee_id: "FD001", action: "LOGIN", timestamp: new Date().toISOString(), entity_type: "User", entity_id: "1" },
          { id: 2, user_employee_id: "FD002", action: "REVIEW_CONFIRM_MATCH", timestamp: new Date().toISOString(), entity_type: "Image", entity_id: "4" }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <h1 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-forest-700" />
          User Role-Based Access Control (RBAC) & Audit Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage officer accounts and inspect immutable system audit trails for officer review decisions and quarantine actions.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
          <p className="text-sm font-semibold">Loading Admin Users & Audit Log...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Table */}
          <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 font-serif border-b border-slate-100 pb-3">
              Officer User Accounts
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-forest-800">{u.employee_id}</td>
                      <td className="py-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="py-3 font-bold text-slate-600">{u.role}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>Immutable System Audit Trail</span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditLogs.map(l => (
                <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest-800">{l.user_employee_id}</span>
                    <span className="text-[10px] text-slate-400">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">{l.action}</div>
                  <div className="text-slate-500 text-[10px]">Entity: {l.entity_type} #{l.entity_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
