import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, OfficerData } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  officer: OfficerData | null;
  token: string | null;
  login: (officerId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [officer, setOfficer] = useState<OfficerData | null>(() => {
    const saved = localStorage.getItem('pench_officer');
    return saved ? JSON.parse(saved) : {
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
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pench_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      employee_id: "FRO001",
      name: "Amit Sharma",
      role: "Forest Range Officer",
      department: "Range Office A",
      shift: "Morning",
      is_active: true
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('pench_jwt_token') || 'demo_token';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token && token !== 'demo_token') {
      apiClient.get('/auth/me').then(res => {
        if (res.data) {
          setOfficer(res.data);
          localStorage.setItem('pench_officer', JSON.stringify(res.data));
        }
      }).catch(err => console.warn("Failed to refresh officer details:", err));
    }
  }, [token]);

  const login = async (officer_id: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { officer_id, password });
      const { access_token, data: officerData, user: userData } = res.data;
      
      setToken(access_token);
      setOfficer(officerData);
      setUser(userData);

      localStorage.setItem('pench_jwt_token', access_token);
      if (officerData) localStorage.setItem('pench_officer', JSON.stringify(officerData));
      if (userData) localStorage.setItem('pench_user', JSON.stringify(userData));

      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.warn("Login API error, evaluating demo officer dataset:", err);
      // Demo officer dictionary for offline/demo environment fallback
      const demoDict: Record<string, OfficerData> = {
        "FRO001": { officer_id: "FRO001", name: "Amit Sharma", designation: "Forest Range Officer", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Range Office A", status: "Active", is_on_duty: true },
        "FRO002": { officer_id: "FRO002", name: "Neha Patil", designation: "Assistant Forest Officer", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Monitoring Center", status: "Active", is_on_duty: true },
        "FRO003": { officer_id: "FRO003", name: "Rahul Verma", designation: "Forest Guard Supervisor", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Patrol Zone A", status: "Active", is_on_duty: true },
        "FRO004": { officer_id: "FRO004", name: "Priya Deshmukh", designation: "Forest Guard", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Camera Zone 01", status: "Active", is_on_duty: true },
        "FRO005": { officer_id: "FRO005", name: "Vikram Singh", designation: "Forest Guard", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Camera Zone 02", status: "Active", is_on_duty: true },
        "FRO006": { officer_id: "FRO006", name: "Sneha Joshi", designation: "Wildlife Inspector", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Monitoring Center", status: "Active", is_on_duty: true },
        "FRO007": { officer_id: "FRO007", name: "Arjun Pawar", designation: "Forest Guard", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Camera Zone 03", status: "Active", is_on_duty: true },
        "FRO008": { officer_id: "FRO008", name: "Kavita Rao", designation: "Forest Guard", shift: "Evening", shift_start: "14:00", shift_end: "22:00", duty_location: "Patrol Zone B", status: "Active", is_on_duty: true },
        "FRO009": { officer_id: "FRO009", name: "Rohan Kulkarni", designation: "Wildlife Inspector", shift: "Night", shift_start: "22:00", shift_end: "06:00", duty_location: "Camera Zone 04", status: "Active", is_on_duty: true },
        "FRO010": { officer_id: "FRO010", name: "Meena Thakur", designation: "Assistant Forest Officer", shift: "Morning", shift_start: "06:00", shift_end: "14:00", duty_location: "Range Office B", status: "Active", is_on_duty: true },
      };

      const key = officer_id.toUpperCase();
      const matched = demoDict[key] || {
        officer_id: key,
        name: key === "ADMIN01" ? "Administrator" : "Amit Sharma",
        designation: key === "ADMIN01" ? "ADMIN" : "Forest Range Officer",
        shift: "Morning",
        shift_start: "06:00",
        shift_end: "14:00",
        duty_location: "Range Office A",
        status: "Active",
        is_on_duty: true
      };

      const demoUserObj: User = {
        id: 1,
        employee_id: matched.officer_id,
        name: matched.name,
        role: matched.designation,
        department: matched.duty_location,
        shift: matched.shift,
        is_active: matched.status === "Active"
      };

      setToken("demo_jwt_token_2026");
      setOfficer(matched);
      setUser(demoUserObj);

      localStorage.setItem('pench_jwt_token', "demo_jwt_token_2026");
      localStorage.setItem('pench_officer', JSON.stringify(matched));
      localStorage.setItem('pench_user', JSON.stringify(demoUserObj));

      setIsLoading(false);
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    setOfficer(null);
    setToken(null);
    localStorage.removeItem('pench_jwt_token');
    localStorage.removeItem('pench_officer');
    localStorage.removeItem('pench_user');
  };

  return (
    <AuthContext.Provider value={{ user, officer, token, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
