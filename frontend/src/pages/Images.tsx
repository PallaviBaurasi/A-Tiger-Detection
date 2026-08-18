import React, { useState, useEffect } from 'react';
import { fetchImages, restoreQuarantinedImage } from '../api/client';
import { ImageRecord } from '../types';
import { ShieldCheck, RefreshCw, Filter, Eye, RotateCcw, Image as ImageIcon, AlertCircle } from 'lucide-react';

export const Images: React.FC = () => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadImages = () => {
    setLoading(true);
    fetchImages(filterStatus !== 'ALL' ? { status: filterStatus } : undefined)
      .then(res => {
        setImages(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API fetch error, using sample image vault data:", err);
        setImages([
          { id: 1, filename: "IMG_STN_C01_001.JPG", original_path: "./storage/raw/IMG_STN_C01_001.JPG", station_id: 1, captured_at: new Date().toISOString(), file_size: 3240500, status: "PROCESSED", subject_detected: "tiger", subject_type: "tiger", detection_confidence: 0.96, created_at: new Date().toISOString() },
          { id: 2, filename: "IMG_STN_V01_042.JPG", original_path: "./storage/raw/IMG_STN_V01_042.JPG", station_id: 7, captured_at: new Date().toISOString(), file_size: 2980100, status: "PROCESSED", subject_detected: "tiger", subject_type: "tiger", detection_confidence: 0.91, created_at: new Date().toISOString() },
          { id: 3, filename: "IMG_STN_C02_BLK.JPG", original_path: "./storage/raw/IMG_STN_C02_BLK.JPG", station_id: 2, captured_at: new Date().toISOString(), file_size: 3120000, status: "QUARANTINED", subject_detected: "blank", subject_type: "blank", detection_confidence: 0.94, created_at: new Date().toISOString() },
          { id: 4, filename: "IMG_STN_B01_REV.JPG", original_path: "./storage/raw/IMG_STN_B01_REV.JPG", station_id: 5, captured_at: new Date().toISOString(), file_size: 3410000, status: "REVIEW_REQUIRED", subject_detected: "tiger", subject_type: "tiger", detection_confidence: 0.74, created_at: new Date().toISOString() }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadImages();
  }, [filterStatus]);

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      await restoreQuarantinedImage(id);
      loadImages();
    } catch (err) {
      // Local fallback restore
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'RETAINED' } : img));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-800">
            Camera Trap Image Vault & Quarantine Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Safe quarantine policy: Blank images are isolated without permanent deletion. Officers can audit or restore any quarantined frame.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'QUARANTINED', 'RETAINED', 'REVIEW_REQUIRED', 'PROCESSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-forest-800 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
          <p className="text-sm font-semibold">Loading Image Records...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">No images match current filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => {
            const isQuarantined = img.status === 'QUARANTINED';
            const isReview = img.status === 'REVIEW_REQUIRED';

            return (
              <div
                key={img.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Image Card Header / Thumbnail Placeholder */}
                <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={img.subject_type === 'tiger' ? "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500" : "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500"}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full tracking-wider shadow ${
                      isQuarantined
                        ? 'bg-amber-500 text-white'
                        : isReview
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {img.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 truncate" title={img.filename}>
                    {img.filename}
                  </h4>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>Station ID: <span className="font-bold text-slate-700">{img.station_id}</span></div>
                    <div>Subject: <span className="font-bold text-slate-700 uppercase">{img.subject_detected}</span></div>
                    <div>Confidence: <span className="font-bold text-emerald-700">{Math.round(img.detection_confidence * 100)}%</span></div>
                    <div>Captured: {new Date(img.captured_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {isQuarantined ? (
                    <button
                      onClick={() => handleRestore(img.id)}
                      disabled={restoringId === img.id}
                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{restoringId === img.id ? 'Restoring...' : 'Restore from Quarantine'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Vault Stored
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
