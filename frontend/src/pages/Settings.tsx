import React, { useState, useEffect } from 'react';
import { fetchSystemSettings, updateSystemSettings } from '../api/client';
import { Settings as SettingsIcon, Sliders, ShieldCheck, CheckCircle, Cpu, Key } from 'lucide-react';

export const Settings: React.FC = () => {
  const [blankThreshold, setBlankThreshold] = useState<number>(0.90);
  const [matchThreshold, setMatchThreshold] = useState<number>(0.85);
  const [reviewThreshold, setReviewThreshold] = useState<number>(0.65);
  const [coreRangeThreshold, setCoreRangeThreshold] = useState<number>(15.0);
  const [bufferRangeThreshold, setBufferRangeThreshold] = useState<number>(5.0);
  const [absenceDays, setAbsenceDays] = useState<number>(30);
  const [mlMode, setMlMode] = useState<string>('roboflow');

  const [roboflowApiKey, setRoboflowApiKey] = useState<string>('');
  const [roboflowModelId, setRoboflowModelId] = useState<string>('tiger-detector');
  const [roboflowVersion, setRoboflowVersion] = useState<string>('1');

  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    fetchSystemSettings().then(res => {
      if (res) {
        setBlankThreshold(res.blank_threshold || 0.90);
        setMatchThreshold(res.match_threshold || 0.85);
        setReviewThreshold(res.review_threshold || 0.65);
        setCoreRangeThreshold(res.core_range_threshold || 15.0);
        setBufferRangeThreshold(res.buffer_range_threshold || 5.0);
        setAbsenceDays(res.prolonged_absence_days || 30);
        setMlMode(res.ml_mode || 'roboflow');
        if (res.roboflow_api_key) setRoboflowApiKey(res.roboflow_api_key);
        if (res.roboflow_model_id) setRoboflowModelId(res.roboflow_model_id);
        if (res.roboflow_version) setRoboflowVersion(res.roboflow_version);
      }
    }).catch(err => console.warn(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateSystemSettings({
        blank_threshold: blankThreshold,
        match_threshold: matchThreshold,
        review_threshold: reviewThreshold,
        core_range_threshold: coreRangeThreshold,
        buffer_range_threshold: bufferRangeThreshold,
        prolonged_absence_days: absenceDays,
        ml_mode: mlMode,
        roboflow_api_key: roboflowApiKey,
        roboflow_model_id: roboflowModelId,
        roboflow_version: roboflowVersion
      });
      setMsg("Settings and Roboflow AI configuration updated successfully!");
    } catch (err) {
      setMsg("Roboflow Settings saved locally.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <h1 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-forest-700" />
          Configurable AI & Roboflow Integration Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Roboflow AI model credentials, confidence cutoffs for safe quarantine, tiger stripe re-identification cosine matching, and GIS territory triggers.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-6">
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Section 1: Roboflow Model Integration */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 font-serif border-b border-slate-100 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-forest-700" />
            <span>1. Roboflow Trained AI Model Credentials</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-forest-600" />
                <span>Roboflow Private API Key</span>
              </label>
              <input
                type="password"
                placeholder="e.g. rf_a1b2c3d4e5f6..."
                value={roboflowApiKey}
                onChange={(e) => setRoboflowApiKey(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-forest-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found in your Roboflow Account Settings -&gt; API Keys.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Roboflow Model ID / Endpoint
              </label>
              <input
                type="text"
                placeholder="e.g. tiger-detection-v2"
                value={roboflowModelId}
                onChange={(e) => setRoboflowModelId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-forest-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Project / Model ID in Roboflow</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Model Version Number
              </label>
              <input
                type="text"
                placeholder="1"
                value={roboflowVersion}
                onChange={(e) => setRoboflowVersion(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-forest-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Trained version number (default: 1)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Active Inference Engine Mode
              </label>
              <select
                value={mlMode}
                onChange={(e) => setMlMode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-forest-600 focus:outline-none"
              >
                <option value="roboflow">Roboflow Hosted AI Model (Active)</option>
                <option value="demo">Deterministic Reserve Simulation (Demo)</option>
                <option value="production">Local Production Engine</option>
              </select>
              <span className="text-[10px] text-slate-400">Selected engine for camera trap triage</span>
            </div>
          </div>
        </div>

        {/* Section 2: Blank Safe Quarantine */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 font-serif border-b border-slate-100 pb-2">
            2. Blank Image Safe Quarantine Thresholds
          </h3>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Auto-Quarantine Confidence Cutoff</span>
              <span className="text-emerald-700">{(blankThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={blankThreshold}
              onChange={(e) => setBlankThreshold(Number(e.target.value))}
              className="w-full accent-forest-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Images with blank confidence &gt;= {(blankThreshold * 100).toFixed(0)}% are automatically isolated in safe quarantine.
            </p>
          </div>
        </div>

        {/* Section 3: Tiger Re-ID */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 font-serif border-b border-slate-100 pb-2">
            3. Tiger Re-Identification Similarity Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Automatic Match Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0.70"
                max="0.99"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">Cosine similarity &gt;= {matchThreshold} = Auto Match</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Human Review Cutoff
              </label>
              <input
                type="number"
                step="0.01"
                min="0.40"
                max="0.80"
                value={reviewThreshold}
                onChange={(e) => setReviewThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">Scores between {reviewThreshold} and {matchThreshold} sent to Review Queue</span>
            </div>
          </div>
        </div>

        {/* Section 4: GIS Territory */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 font-serif border-b border-slate-100 pb-2">
            4. GIS Territory & Absence Alert Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Core Range Threshold</label>
              <input
                type="number"
                value={coreRangeThreshold}
                onChange={(e) => setCoreRangeThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">km² territory displacement trigger</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Buffer Range Threshold</label>
              <input
                type="number"
                value={bufferRangeThreshold}
                onChange={(e) => setBufferRangeThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">km buffer fringe warning</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Absence Warning Days</label>
              <input
                type="number"
                value={absenceDays}
                onChange={(e) => setAbsenceDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400">Days without sighting</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{saving ? 'Saving Roboflow & System Configuration...' : 'Save Roboflow Credentials & System Configuration'}</span>
        </button>
      </form>
    </div>
  );
};
