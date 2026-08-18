import React, { useState } from 'react';
import { FileText, Download, Printer, ShieldCheck, Trees, CheckCircle, Table } from 'lucide-react';

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'RUN' | 'TIGER' | 'OVERALL'>('OVERALL');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-forest-700" />
            Forest Department Official Intelligence Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export official camera trap triage summaries, tiger movement dossiers, and spatial occupancy reports for Pench Tiger Reserve.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          
          <a
            href="http://127.0.0.1:5000/api/reports/export/csv/1"
            download
            className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 space-y-6 font-sans">
        {/* Official Header Badge */}
        <div className="border-b-2 border-forest-800 pb-6 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xl shadow">
            PTR
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide font-serif">
            Madhya Pradesh Forest Department
          </h2>
          <h3 className="text-sm font-bold text-forest-700 uppercase tracking-widest">
            Pench Tiger Reserve Wildlife Division
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Automated Camera Trap Triage & Individual Movement Intelligence Dossier
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Date Generated: {new Date().toLocaleDateString()} • Report ID: PTR-INTEL-2026-08
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider font-serif border-l-4 border-forest-700 pl-3">
            1. Executive Triage Summary
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            During the current survey period, a total of <strong>1,250 raw camera-trap images</strong> were processed through the automated triage pipeline. The safe-quarantine algorithm identified and isolated <strong>840 blank/no-subject frames (67.2% quarantine rate)</strong>, saving approximately <strong>2.62 GB of storage</strong> without permanent file deletion.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ingested</span>
              <span className="text-lg font-bold text-slate-800">1,250 Frames</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Blank Quarantined</span>
              <span className="text-lg font-bold text-emerald-900">840 Frames</span>
            </div>
            <div className="p-3 bg-forest-50 rounded-xl border border-forest-200">
              <span className="text-[10px] uppercase font-bold text-forest-700 block">Retained Animal Frames</span>
              <span className="text-lg font-bold text-forest-900">410 Frames</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Human Review Required</span>
              <span className="text-lg font-bold text-amber-900">4 Items</span>
            </div>
          </div>
        </div>

        {/* Section 2: Individual Tiger Movement & Occupancy */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider font-serif border-l-4 border-forest-700 pl-3">
            2. Individual Tiger Population & Spatial Occupancy Status
          </h4>
          
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 border-b">Tiger ID</th>
                <th className="p-3 border-b">Name / Descriptor</th>
                <th className="p-3 border-b">Sex</th>
                <th className="p-3 border-b text-center">Captures</th>
                <th className="p-3 border-b text-center">Stations</th>
                <th className="p-3 border-b text-right">Occupied Area ($km^2$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-bold text-forest-800">TIGER-001</td>
                <td className="p-3 font-semibold text-slate-800">T-101 (Collarwali Descendant)</td>
                <td className="p-3 text-slate-600">FEMALE</td>
                <td className="p-3 text-center font-bold">18</td>
                <td className="p-3 text-center">5</td>
                <td className="p-3 text-right font-bold text-emerald-700">31.7 km²</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-forest-800">TIGER-002</td>
                <td className="p-3 font-semibold text-slate-800">T-102 (Chhota Male)</td>
                <td className="p-3 text-slate-600">MALE</td>
                <td className="p-3 text-center font-bold">14</td>
                <td className="p-3 text-center">4</td>
                <td className="p-3 text-right font-bold text-emerald-700">28.4 km²</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-forest-800">TIGER-003</td>
                <td className="p-3 font-semibold text-slate-800">T-103 (Baghini Female)</td>
                <td className="p-3 text-slate-600">FEMALE</td>
                <td className="p-3 text-center font-bold">12</td>
                <td className="p-3 text-center">3</td>
                <td className="p-3 text-right font-bold text-emerald-700">24.1 km²</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Scientific Methodology & Transparency */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Scientific Transparency & Methodology Information</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Safe quarantine ensures no camera trap image is permanently erased automatically. Tiger Re-ID uses ResNet-50 stripe feature extraction with Cosine similarity matching. Home range measurements use geodetic convex hulls and are labeled as <em>Estimated Occupied Area</em> for scientific rigor.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1"></div>
            <div className="font-bold text-slate-800">Field Officer In-Charge</div>
            <div className="text-[10px] text-slate-400">Pench Wildlife Division</div>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1"></div>
            <div className="font-bold text-slate-800">Deputy Field Director</div>
            <div className="text-[10px] text-slate-400">Pench Tiger Reserve, MP</div>
          </div>
        </div>
      </div>
    </div>
  );
};
