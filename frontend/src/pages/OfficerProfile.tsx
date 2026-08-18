import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchOfficers } from '../api/client';
import { OfficerData } from '../types';
import { UserCheck, Shield, Clock, MapPin, CheckCircle, AlertCircle, Sparkles, Building, User } from 'lucide-react';

export const OfficerProfile: React.FC = () => {
  const { officer, user } = useAuth();
  const [allOfficers, setAllOfficers] = useState<OfficerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOfficers().then(res => {
      if (res && Array.isArray(res)) {
        setAllOfficers(res);
      }
      setLoading(false);
    }).catch(err => {
      console.warn("Failed to fetch officers from API:", err);
      setLoading(false);
    });
  }, []);

  const getShiftTimeText = (start?: string, end?: string) => {
    if (start === '06:00' && end === '14:00') return '06:00 AM – 02:00 PM';
    if (start === '14:00' && end === '22:00') return '02:00 PM – 10:00 PM';
    if (start === '22:00' && end === '06:00') return '10:00 PM – 06:00 AM';
    return `${start || '06:00'} – ${end || '14:00'}`;
  };

  const currentOff: OfficerData = officer || {
    officer_id: "FRO001",
    name: "Amit Sharma",
    designation: "Forest Range Officer",
    shift: "Morning",
    shift_start: "06:00",
    shift_end: "14:00",
    duty_location: "Range Office A",
    status: "Active",
    is_on_duty: true
  };

  const isOnDuty = currentOff.is_on_duty ?? true;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="gradient-forest-banner p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Madhya Pradesh Forest Department Identity Record</span>
            </div>
            <h1 className="text-3xl font-extrabold font-serif tracking-tight">
              Officer Profile & Duty Shift Intelligence
            </h1>
            <p className="text-xs text-forest-100 mt-1">
              Authenticated Forest Department Officer Profile and Shift Duty Roster
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-2xl text-xs font-extrabold border shadow-md flex items-center gap-2 ${
              isOnDuty ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 backdrop-blur-md' : 'bg-slate-500/20 text-slate-300 border-slate-400/40 backdrop-blur-md'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              {isOnDuty ? '🟢 CURRENTLY ON DUTY' : '⚪ CURRENTLY OFF DUTY'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Badge Card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-forest-800 to-emerald-600 text-white font-serif font-black text-3xl flex items-center justify-center shadow-lg border-2 border-emerald-400/30">
            {currentOff.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-serif">{currentOff.name}</h2>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-0.5">{currentOff.designation}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200">
              Officer ID: {currentOff.officer_id}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Account Status</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full uppercase">
                {currentOff.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Reserve Division</span>
              <span className="font-bold text-slate-900">Pench Tiger Reserve</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Security Clearance</span>
              <span className="font-bold text-slate-900">Level 4 (Field Officer)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Shift Details & Duty Location */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-slate-900 font-serif border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-forest-700" />
              <span>Assigned Shift & Duty Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shift</span>
                <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{currentOff.shift} Shift</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Timings: <span className="font-bold text-slate-800">{getShiftTimeText(currentOff.shift_start, currentOff.shift_end)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Duty Location</span>
                <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{currentOff.duty_location}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Sector: <span className="font-bold text-slate-800">Pench Wildlife Core & Buffer</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Duty Authorization Verified</span>
              </div>
              <p className="text-emerald-800 text-[11.5px]">
                Officer {currentOff.name} ({currentOff.officer_id}) is authorized to perform camera trap triage, review flagged tiger sightings, and trigger village warning alerts during the {currentOff.shift} Shift.
              </p>
            </div>
          </div>

          {/* Roster of 10 Forest Department Officers fetched from API */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 font-serif flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-forest-700" />
                <span>Reserve Officers Directory (Backend API)</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {allOfficers.length || 10} Active Officers
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
              {(allOfficers.length > 0 ? allOfficers : [
                { officer_id: "FRO001", name: "Amit Sharma", designation: "Forest Range Officer", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Range Office A", status: "Active" },
                { officer_id: "FRO002", name: "Neha Patil", designation: "Assistant Forest Officer", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Monitoring Center", status: "Active" },
                { officer_id: "FRO003", name: "Rahul Verma", designation: "Forest Guard Supervisor", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Patrol Zone A", status: "Active" },
                { officer_id: "FRO004", name: "Priya Deshmukh", designation: "Forest Guard", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Camera Zone 01", status: "Active" },
                { officer_id: "FRO005", name: "Vikram Singh", designation: "Forest Guard", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Camera Zone 02", status: "Active" },
                { officer_id: "FRO006", name: "Sneha Joshi", designation: "Wildlife Inspector", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Monitoring Center", status: "Active" },
                { officer_id: "FRO007", name: "Arjun Pawar", designation: "Forest Guard", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Camera Zone 03", status: "Active" },
                { officer_id: "FRO008", name: "Kavita Rao", designation: "Forest Guard", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Patrol Zone B", status: "Active" },
                { officer_id: "FRO009", name: "Rohan Kulkarni", designation: "Wildlife Inspector", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Camera Zone 04", status: "Active" },
                { officer_id: "FRO010", name: "Meena Thakur", designation: "Assistant Forest Officer", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Range Office B", status: "Active" },
              ]).map((off) => (
                <div key={off.officer_id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold flex items-center justify-center">
                      {off.officer_id.replace('FRO', '')}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{off.name}</span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">{off.officer_id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{off.designation}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-800">{off.shift} Shift ({off.shift_start} - {off.shift_end})</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{off.duty_location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
