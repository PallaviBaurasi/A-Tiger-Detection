import React, { useState, useEffect } from 'react';
import { fetchReviewQueue, submitReviewDecision } from '../api/client';
import { UserCheck, Check, Plus, X, RefreshCw, AlertCircle, Sparkles, MapPin } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTigerMatch, setSelectedTigerMatch] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadQueue = () => {
    setLoading(true);
    fetchReviewQueue()
      .then(res => {
        setQueue(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API queue fetch error, using sample review item:", err);
        setQueue([
          {
            image_id: 4,
            filename: "IMG_STN_B01_REV.JPG",
            original_path: "./storage/raw/IMG_STN_B01_REV.JPG",
            captured_at: new Date().toISOString(),
            station_code: "STN-B01",
            station_name: "Khawasa Buffer Checkpost",
            latitude: 21.5890,
            longitude: 79.2510,
            detection_confidence: 0.78,
            subject_detected: "tiger",
            top_matches: [
              { tiger_id: 2, tiger_code: "TIGER-002", display_name: "T-102 (Chhota Male)", similarity_score: 0.74, profile_image_url: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=500", last_seen: new Date().toISOString() },
              { tiger_id: 5, tiger_code: "TIGER-005", display_name: "T-105 (Karmajhiri Sub-Adult)", similarity_score: 0.68, profile_image_url: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500", last_seen: new Date().toISOString() }
            ]
          }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (imageId: number, action: string, targetTigerId?: number) => {
    setSubmittingId(imageId);
    try {
      await submitReviewDecision(imageId, action, targetTigerId);
      loadQueue();
    } catch (err) {
      setQueue(prev => prev.filter(item => item.image_id !== imageId));
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
        <p className="text-sm font-semibold">Loading Human Triage Queue...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold font-serif text-slate-800">
              Human Review Triage Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review ambiguous AI stripe-pattern match candidates (similarity scores 65% to 85%). Confirm match, enroll new individual, or reject.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">
          {queue.length} Item(s) Pending Review
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Sparkles className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
          <h3 className="font-bold text-lg text-slate-800 font-serif">Queue Clear!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All retained camera trap imagery has been identified and processed. No pending officer review items.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((item) => {
            const selectedMatchId = selectedTigerMatch[item.image_id] || (item.top_matches[0]?.tiger_id);

            return (
              <div
                key={item.image_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100"
              >
                {/* Left Col: Candidate Image & Metadata (5 Cols) */}
                <div className="md:col-span-5 p-5 space-y-4 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-500 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider">
                      Candidate Frame #{item.image_id}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{item.station_code}</span>
                  </div>

                  {/* Image Display */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-64 bg-slate-200">
                    <img
                      src="https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600"
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
                      Detection Conf: {Math.round(item.detection_confidence * 100)}%
                    </div>
                  </div>

                  {/* Capture Metadata */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800">{item.station_name}</div>
                    <div className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-600" />
                      <span>GPS: {item.latitude}, {item.longitude}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Captured: {new Date(item.captured_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Right Col: Top Matching Catalogue Tigers (7 Cols) */}
                <div className="md:col-span-7 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 font-serif mb-1">
                      Top Stripe Similarity Catalogue Matches
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Select matching individual tiger identity below or enroll as new tiger.
                    </p>

                    <div className="space-y-3">
                      {item.top_matches.map((match: any) => {
                        const isSelected = selectedMatchId === match.tiger_id;

                        return (
                          <div
                            key={match.tiger_id}
                            onClick={() => setSelectedTigerMatch(prev => ({ ...prev, [item.image_id]: match.tiger_id }))}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/20'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={match.profile_image_url || "https://images.unsplash.com/photo-1549366021-9f761d450615?w=500"}
                                alt={match.tiger_code}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-xs text-slate-900">{match.display_name}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{match.tiger_code}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-extrabold text-emerald-700">
                                {Math.round(match.similarity_score * 100)}% Match
                              </div>
                              <div className="text-[10px] text-slate-400">Stripe Cosine Sim</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDecision(item.image_id, 'CONFIRM_MATCH', selectedMatchId)}
                      disabled={submittingId === item.image_id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Match</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.image_id, 'CREATE_NEW_TIGER')}
                      disabled={submittingId === item.image_id}
                      className="py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Tiger</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.image_id, 'REJECT')}
                      disabled={submittingId === item.image_id}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
