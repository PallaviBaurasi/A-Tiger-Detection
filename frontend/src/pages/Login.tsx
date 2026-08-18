import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Trees, AlertCircle, Sparkles, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [officerId, setOfficerId] = useState('FRO001');
  const [password, setPassword] = useState('Forest@123');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const demoOfficers = [
    { id: 'FRO001', name: 'Amit Sharma', role: 'Forest Range Officer', shift: 'Morning', pass: 'Forest@123' },
    { id: 'FRO002', name: 'Neha Patil', role: 'Assistant Forest Officer', shift: 'Evening', pass: 'Tiger@456' },
    { id: 'FRO003', name: 'Rahul Verma', role: 'Forest Guard Supervisor', shift: 'Night', pass: 'Pench@789' },
    { id: 'FRO004', name: 'Priya Deshmukh', role: 'Forest Guard', shift: 'Morning', pass: 'Forest#234' },
    { id: 'FRO005', name: 'Vikram Singh', role: 'Forest Guard', shift: 'Evening', pass: 'Tiger#567' },
    { id: 'FRO006', name: 'Sneha Joshi', role: 'Wildlife Inspector', shift: 'Night', pass: 'Wild@890' },
    { id: 'FRO007', name: 'Arjun Pawar', role: 'Forest Guard', shift: 'Morning', pass: 'Pench#345' },
    { id: 'FRO008', name: 'Kavita Rao', role: 'Forest Guard', shift: 'Evening', pass: 'Forest#678' },
    { id: 'FRO009', name: 'Rohan Kulkarni', role: 'Wildlife Inspector', shift: 'Night', pass: 'Tiger@901' },
    { id: 'FRO010', name: 'Meena Thakur', role: 'Assistant Forest Officer', shift: 'Morning', pass: 'Wild#123' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(officerId, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid Officer ID or Password.');
    }
  };

  const handleQuickLogin = (id: string, pass: string) => {
    setOfficerId(id);
    setPassword(pass);
    login(id, pass).then(() => navigate('/dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full glass-panel rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10 my-8">
        {/* Header Banner */}
        <div className="gradient-forest-banner text-white p-6 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl">
              <div className="w-full h-full bg-forest-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Trees className="w-7 h-7" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold font-serif tracking-tight text-white">
              Pench Vission
            </h1>
            <p className="text-[10px] text-emerald-300 uppercase tracking-widest mt-1 font-bold flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Forest Department Officer Portal
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white/95">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="e.g. FRO001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isLoading ? 'Authenticating Officer...' : 'Authenticate & Enter Pench Vission'}</span>
          </button>

          {/* Quick 1-Click Demo Officer Roster */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                Select Demo Officer Account (1-Click Login)
              </p>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                10 Active Officers
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {demoOfficers.map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => handleQuickLogin(off.id, off.pass)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer shadow-2xs ${
                    officerId === off.id
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/80 hover:bg-emerald-50/50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-slate-900 truncate">{off.name}</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1 rounded shrink-0">{off.id}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 truncate mt-0.5">{off.role}</div>
                  <div className="text-[9px] text-slate-400 font-medium">{off.shift} Shift • PW: <span className="font-mono text-slate-600">{off.pass}</span></div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
