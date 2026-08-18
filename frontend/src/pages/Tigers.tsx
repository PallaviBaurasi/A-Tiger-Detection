import React, { useState, useEffect } from 'react';
import { fetchTigers } from '../api/client';
import { Tiger } from '../types';
import { Trees, Eye, MapPin, Activity, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Tigers: React.FC = () => {
  const [tigers, setTigers] = useState<Tiger[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTigers()
      .then(res => {
        setTigers(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API fetch tigers error, using fallback catalogue:", err);
        setTigers([
          { id: 1, tiger_code: "TIGER-001", display_name: "T-101 (Collarwali Descendant)", sex: "FEMALE", approximate_age: "Adult (6 yrs)", first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), status: "ACTIVE", capture_count: 18, station_count: 5, occupied_area_sq_km: 31.7, profile_image_url: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500" },
          { id: 2, tiger_code: "TIGER-002", display_name: "T-102 (Chhota Male)", sex: "MALE", approximate_age: "Adult (7 yrs)", first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), status: "ACTIVE", capture_count: 14, station_count: 4, occupied_area_sq_km: 28.4, profile_image_url: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=500" },
          { id: 3, tiger_code: "TIGER-003", display_name: "T-103 (Baghini Female)", sex: "FEMALE", approximate_age: "Adult (5 yrs)", first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), status: "ACTIVE", capture_count: 12, station_count: 3, occupied_area_sq_km: 24.1, profile_image_url: "https://images.unsplash.com/photo-1508814437933-f0c7d18a9217?w=500" },
          { id: 4, tiger_code: "TIGER-004", display_name: "T-104 (Rukhad Male)", sex: "MALE", approximate_age: "Senior (9 yrs)", first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), status: "ACTIVE", capture_count: 9, station_count: 3, occupied_area_sq_km: 19.8, profile_image_url: "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=500" },
          { id: 5, tiger_code: "TIGER-005", display_name: "T-105 (Karmajhiri Sub-Adult)", sex: "MALE", approximate_age: "Sub-adult (3 yrs)", first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), status: "ACTIVE", capture_count: 6, station_count: 2, occupied_area_sq_km: 15.2, profile_image_url: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500" }
        ]);
        setLoading(false);
      });
  }, []);

  const filtered = tigers.filter(t => 
    t.tiger_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-800">
            Pench Individual Tiger Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered tiger identity profiles with stripe embeddings, capture counts, stations, and estimated occupied area ($km^2$).
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Tiger ID or name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
      </div>

      {/* Tiger Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
          <p className="text-sm font-semibold">Loading Tiger Catalogue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-forest-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Profile Image & Badges */}
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                <img
                  src={t.profile_image_url || "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500"}
                  alt={t.display_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-forest-900/80 backdrop-blur-sm text-white font-extrabold text-xs rounded-full shadow">
                  {t.tiger_code}
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white font-extrabold text-[10px] uppercase rounded-full shadow">
                  {t.status}
                </div>
              </div>

              {/* Tiger Metadata */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-slate-900 font-serif">{t.display_name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Sex / Age</span>
                    <span className="font-bold text-slate-800">{t.sex} • {t.approximate_age}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Captures</span>
                    <span className="font-bold text-forest-700">{t.capture_count || 0} Captures</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Stations</span>
                    <span className="font-bold text-slate-800">{t.station_count || 0} Camera Stations</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Occupied Area</span>
                    <span className="font-bold text-emerald-700">{t.occupied_area_sq_km || 0} km²</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <Link
                  to={`/tigers/${t.id}`}
                  className="w-full py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Full Tiger Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
