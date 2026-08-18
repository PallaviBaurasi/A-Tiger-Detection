import React, { useState, useEffect } from 'react';
import { fetchStations } from '../api/client';
import { CameraStation } from '../types';
import { MapPin, RefreshCw, Shield, Trees, AlertTriangle, Plus } from 'lucide-react';

export const Stations: React.FC = () => {
  const [stations, setStations] = useState<CameraStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStations()
      .then(res => {
        setStations(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API stations error, using fallback stations:", err);
        setStations([
          { id: 1, station_code: "STN-C01", station_name: "Karmajhiri Stream North", latitude: 21.6720, longitude: 79.3150, zone: "Karmajhiri Range", region_type: "CORE", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 2, station_code: "STN-C02", station_name: "Touria Waterhole West", latitude: 21.6450, longitude: 79.2840, zone: "Touria Range", region_type: "CORE", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 3, station_code: "STN-C03", station_name: "Mahadev Ghat Ridge", latitude: 21.6910, longitude: 79.3320, zone: "Karmajhiri Range", region_type: "CORE", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 4, station_code: "STN-C04", station_name: "Gumtara Meadow Central", latitude: 21.6280, longitude: 79.3450, zone: "Gumtara Range", region_type: "CORE", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 5, station_code: "STN-B01", station_name: "Khawasa Buffer Checkpost", latitude: 21.5890, longitude: 79.2510, zone: "Khawasa Buffer", region_type: "BUFFER", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 6, station_code: "STN-B02", station_name: "Rukhad Buffer Corridor", latitude: 21.7250, longitude: 79.3800, zone: "Rukhad Buffer", region_type: "BUFFER", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 7, station_code: "STN-V01", station_name: "Kohka Village Fringe", latitude: 21.5720, longitude: 79.2280, zone: "Fringe Corridor", region_type: "VILLAGE_ADJACENT", status: "ACTIVE", installation_date: new Date().toISOString() },
          { id: 8, station_code: "STN-V02", station_name: "Awarghani Village Border", latitude: 21.6110, longitude: 79.2150, zone: "Fringe Corridor", region_type: "VILLAGE_ADJACENT", status: "ACTIVE", installation_date: new Date().toISOString() }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-forest-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-800">
            Pench Camera Trap Stations Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active camera station network categorized by Core Wildlife Zone, Buffer Corridor, and Village-Adjacent Fringe.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
          <p className="text-sm font-semibold">Loading Camera Stations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((stn) => {
            const isCore = stn.region_type === 'CORE';
            const isBuffer = stn.region_type === 'BUFFER';
            const isVillage = stn.region_type === 'VILLAGE_ADJACENT';

            return (
              <div
                key={stn.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-forest-800 px-2.5 py-1 bg-forest-50 rounded-lg border border-forest-100">
                    {stn.station_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      isCore
                        ? 'bg-emerald-100 text-emerald-800'
                        : isBuffer
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stn.region_type}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{stn.station_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{stn.zone}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                    <span>GPS: {stn.latitude}, {stn.longitude}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Status: <strong className="text-emerald-700">{stn.status}</strong></span>
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
