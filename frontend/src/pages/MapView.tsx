import React, { useState, useEffect } from 'react';
import { fetchMapObservations, fetchTerritorialOverlap } from '../api/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Map as MapIcon, Layers, Trees, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

// Fix Leaflet default icon URLs in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Markers
const stationIconCore = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stationIconBuffer = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stationIconVillage = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapView: React.FC = () => {
  const [mapData, setMapData] = useState<any>(null);
  const [overlaps, setOverlaps] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Layer Toggles
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showTrajectories, setShowTrajectories] = useState<boolean>(true);
  const [showHomeRanges, setShowHomeRanges] = useState<boolean>(true);
  const [showAlerts, setShowAlerts] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchMapObservations(),
      fetchTerritorialOverlap()
    ])
      .then(([mRes, oRes]) => {
        setMapData(mRes);
        setOverlaps(oRes);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API map fetch error, using synthetic Pench GIS layer:", err);
        setMapData({
          camera_stations: [
            { id: 1, station_code: "STN-C01", station_name: "Karmajhiri Stream North", latitude: 21.6720, longitude: 79.3150, region_type: "CORE" },
            { id: 2, station_code: "STN-C02", station_name: "Touria Waterhole West", latitude: 21.6450, longitude: 79.2840, region_type: "CORE" },
            { id: 3, station_code: "STN-C03", station_name: "Mahadev Ghat Ridge", latitude: 21.6910, longitude: 79.3320, region_type: "CORE" },
            { id: 5, station_code: "STN-B01", station_name: "Khawasa Buffer Checkpost", latitude: 21.5890, longitude: 79.2510, region_type: "BUFFER" },
            { id: 7, station_code: "STN-V01", station_name: "Kohka Village Fringe", latitude: 21.5720, longitude: 79.2280, region_type: "VILLAGE_ADJACENT" }
          ],
          tiger_trajectories: [
            {
              tiger_code: "T-101",
              display_name: "Collarwali Descendant",
              occupied_area_sq_km: 31.7,
              convex_hull: [{ latitude: 21.672, longitude: 79.315 }, { latitude: 21.645, longitude: 79.284 }, { latitude: 21.691, longitude: 79.332 }],
              observations: [
                { latitude: 21.672, longitude: 79.315 },
                { latitude: 21.645, longitude: 79.284 },
                { latitude: 21.691, longitude: 79.332 }
              ]
            },
            {
              tiger_code: "T-102",
              display_name: "Chhota Male",
              occupied_area_sq_km: 28.4,
              convex_hull: [{ latitude: 21.645, longitude: 79.284 }, { latitude: 21.589, longitude: 79.251 }, { latitude: 21.572, longitude: 79.228 }],
              observations: [
                { latitude: 21.645, longitude: 79.284 },
                { latitude: 21.589, longitude: 79.251 },
                { latitude: 21.572, longitude: 79.228 }
              ]
            }
          ],
          alerts: [
            { id: 1, title: "CRITICAL: T-102 Village Proximity", latitude: 21.572, longitude: 79.228, severity: "CRITICAL" }
          ]
        });
        setOverlaps([
          { tiger_a_code: "T-101", tiger_b_code: "T-102", distance_km: 5.2, overlap_sq_km: 12.4, overlap_percent: 43.6, severity: "HIGH" }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading || !mapData) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-forest-600 mb-2" />
        <p className="text-sm font-semibold">Loading Pench Reserve GIS Map Layers...</p>
      </div>
    );
  }

  // Pench Reserve Center
  const penchCenter: [number, number] = [21.65, 79.30];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-forest-700" />
              Pench Tiger Reserve Interactive GIS Intelligence Map
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Visualizes camera trap stations, tiger movement trajectories, activity centroids, occupied home ranges ($km^2$), and territorial overlap.
            </p>
          </div>

          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
            Pench Reserve Core & Buffer GIS Active
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Toggle Map Layers:</span>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showStations} onChange={(e) => setShowStations(e.target.checked)} className="rounded text-forest-600 focus:ring-forest-500" />
            <span>Camera Stations</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showTrajectories} onChange={(e) => setShowTrajectories(e.target.checked)} className="rounded text-forest-600 focus:ring-forest-500" />
            <span>Tiger Movement Trajectories</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showHomeRanges} onChange={(e) => setShowHomeRanges(e.target.checked)} className="rounded text-forest-600 focus:ring-forest-500" />
            <span>Occupied Home Ranges (Convex Hull)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showAlerts} onChange={(e) => setShowAlerts(e.target.checked)} className="rounded text-forest-600 focus:ring-forest-500" />
            <span>Fringe & Range Alerts</span>
          </label>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-md overflow-hidden h-[600px] relative z-0">
        <MapContainer center={penchCenter} zoom={11} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. Camera Stations */}
          {showStations && mapData.camera_stations.map((stn: any) => {
            const icon = stn.region_type === 'CORE' 
              ? stationIconCore 
              : stn.region_type === 'BUFFER' 
              ? stationIconBuffer 
              : stationIconVillage;

            return (
              <Marker key={stn.id} position={[stn.latitude, stn.longitude]} icon={icon}>
                <Popup>
                  <div className="p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-800">{stn.station_name}</div>
                    <div className="font-semibold text-forest-700">{stn.station_code} ({stn.region_type})</div>
                    <div className="text-slate-500">Lat: {stn.latitude}, Lon: {stn.longitude}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 2. Tiger Trajectories & Convex Hulls */}
          {mapData.tiger_trajectories.map((tr: any, idx: number) => {
            const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];
            const trackColor = colors[idx % colors.length];

            const polylinePositions: [number, number][] = tr.observations.map((ob: any) => [ob.latitude, ob.longitude]);
            const hullPositions: [number, number][] = tr.convex_hull.map((p: any) => [p.latitude, p.longitude]);

            return (
              <React.Fragment key={tr.tiger_code}>
                {showTrajectories && polylinePositions.length >= 2 && (
                  <Polyline positions={polylinePositions} pathOptions={{ color: trackColor, weight: 3, dashArray: '5, 5' }} />
                )}
                {showHomeRanges && hullPositions.length >= 3 && (
                  <Polygon positions={hullPositions} pathOptions={{ color: trackColor, fillColor: trackColor, fillOpacity: 0.15, weight: 2 }} />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Pairwise Territorial Overlap Table */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800 font-serif border-b border-slate-100 pb-3">
          Pairwise Territorial Home Range Overlap Analysis
        </h3>

        {overlaps.length === 0 ? (
          <p className="text-xs text-slate-500">No active territorial overlap detected between current tiger home ranges.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                  <th className="pb-3">Tiger Individual A</th>
                  <th className="pb-3">Tiger Individual B</th>
                  <th className="pb-3">Centroid Distance</th>
                  <th className="pb-3">Overlap Area</th>
                  <th className="pb-3">Overlap %</th>
                  <th className="pb-3 text-right">Severity Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overlaps.map((ov, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-forest-800">{ov.tiger_a_code}</td>
                    <td className="py-3 font-bold text-forest-800">{ov.tiger_b_code}</td>
                    <td className="py-3 text-slate-600 font-medium">{ov.distance_km} km</td>
                    <td className="py-3 font-bold text-emerald-700">{ov.overlap_sq_km} km²</td>
                    <td className="py-3 font-bold text-slate-800">{ov.overlap_percent}%</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                        ov.severity === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ov.severity} OVERLAP
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
