import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Search, Sparkles, Shield, Clock, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, officer, logout } = useAuth();

  const getShiftTimeText = (start?: string, end?: string) => {
    if (start === '06:00' && end === '14:00') return '06:00 AM – 02:00 PM';
    if (start === '14:00' && end === '22:00') return '02:00 PM – 10:00 PM';
    if (start === '22:00' && end === '06:00') return '10:00 PM – 06:00 AM';
    return `${start || '06:00'} – ${end || '14:00'}`;
  };

  const isOnDuty = officer?.is_on_duty ?? true;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30 font-sans">
      {/* Title & Live Roboflow AI Badge */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 font-serif tracking-tight">
              Pench Vission
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-forest-900 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase border border-emerald-500/30">
              AI v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
            <Shield className="w-3 h-3 text-forest-700 inline" />
            Pench Tiger Reserve • Madhya Pradesh Forest Department
          </p>
        </div>

        {/* Roboflow Model Active Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300/80 shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Roboflow AI: <span className="font-mono text-emerald-900 font-extrabold">find-tiger-hdm2r</span> Active</span>
        </div>
      </div>

      {/* Global Search & Officer Status Profile */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden md:block w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Tiger ID (e.g. T-101)..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Live Notification Indicator */}
        <div className="relative p-2 rounded-xl text-slate-600 hover:bg-forest-50 hover:text-forest-800 cursor-pointer transition-colors border border-slate-200/60 shadow-xs">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-ping"></span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Officer User Profile Pill with Shift Details */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-forest-800 to-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
            {officer?.name ? officer.name.charAt(0) : (user?.name ? user.name.charAt(0) : 'O')}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-slate-900">{officer?.name || user?.name || 'Amit Sharma'}</div>
              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                isOnDuty ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                {isOnDuty ? '🟢 On Duty' : '⚪ Off Duty'}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 font-semibold flex items-center gap-1.5">
              <span className="text-emerald-700 font-bold">{officer?.designation || user?.role || 'Forest Range Officer'}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-500">
                <Clock className="w-2.5 h-2.5 inline" />
                {officer?.shift || 'Morning'} ({getShiftTimeText(officer?.shift_start, officer?.shift_end)})
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-500">
                <MapPin className="w-2.5 h-2.5 inline" />
                {officer?.duty_location || 'Range Office A'}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
