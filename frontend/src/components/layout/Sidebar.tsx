import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Image as ImageIcon, 
  UserCheck, 
  Trees, 
  Map as MapIcon, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Users,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const mainNav = [
    { to: '/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/profile', label: 'Officer Profile & Shift', icon: UserCheck, badge: 'Active' },
    { to: '/processing', label: 'Tiger Triage Wizard', icon: PlayCircle, badge: 'Roboflow AI' },
    { to: '/images', label: 'Quarantine & Vault', icon: ImageIcon },
    { to: '/review', label: 'Human Review Queue', icon: UserCheck, countBadge: '4' },
    { to: '/tigers', label: 'Tiger Catalogue', icon: Trees },
    { to: '/map', label: 'GIS Movement Map', icon: MapIcon },
    { to: '/stations', label: 'Camera Stations', icon: Activity },
    { to: '/alerts', label: 'Alert Triage Center', icon: AlertTriangle, countBadge: '4' },
    { to: '/reports', label: 'Intelligence Reports', icon: FileText },
    { to: '/settings', label: 'AI Threshold Settings', icon: Settings },
  ];

  if (user?.role === 'ADMIN') {
    mainNav.push({ to: '/admin/users', label: 'User RBAC & Audit', icon: Users, badge: 'Admin' });
  }

  return (
    <aside className="w-64 gradient-forest-banner text-white min-h-screen flex flex-col shadow-2xl z-20 border-r border-forest-700/50">
      {/* Brand Header */}
      <div className="p-5 border-b border-forest-800/80 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg">
          <div className="w-full h-full bg-forest-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-lg">
            PV
          </div>
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wide text-white font-serif leading-tight">
            Pench Vission
          </h1>
          <p className="text-[10px] text-emerald-300 font-bold tracking-widest uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Reserve Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-emerald-400/80 uppercase">
          Wildlife Monitoring Operations
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-forest-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/40 translate-x-1'
                    : 'text-forest-100 hover:bg-forest-800/60 hover:text-white hover:translate-x-0.5'
                }`
              }
            >
              <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>

              {item.badge && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {item.badge}
                </span>
              )}

              {item.countBadge && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-slate-950 shadow">
                  {item.countBadge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Reserve Seal Footer */}
      <div className="p-4 border-t border-forest-800/80 bg-forest-950/60 text-xs text-forest-300">
        <div className="flex items-center gap-2 mb-1 text-emerald-400 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>MP Forest Department</span>
        </div>
        <p className="text-[10px] text-forest-300/80 leading-tight">
          Pench Tiger Reserve Division • Seoni & Chhindwara, MP
        </p>
      </div>
    </aside>
  );
};
