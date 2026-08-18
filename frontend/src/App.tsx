import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Processing } from './pages/Processing';
import { Images } from './pages/Images';
import { ReviewQueue } from './pages/ReviewQueue';
import { Tigers } from './pages/Tigers';
import { TigerDetail } from './pages/TigerDetail';
import { Stations } from './pages/Stations';
import { MapView } from './pages/MapView';
import { Alerts } from './pages/Alerts';
import { EmergencyAlerts } from './pages/EmergencyAlerts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AdminUsers } from './pages/AdminUsers';
import { OfficerProfile } from './pages/OfficerProfile';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8faf6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<OfficerProfile />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/images" element={<Images />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/tigers" element={<Tigers />} />
            <Route path="/tigers/:id" element={<TigerDetail />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/emergency" element={<EmergencyAlerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
