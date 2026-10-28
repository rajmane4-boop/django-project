import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MedicationListPage from './pages/medications/MedicationListPage';
import RegimenListPage from './pages/regimens/RegimenListPage';
import CaregiverListPage from './pages/caregivers/CaregiverListPage';
import CaregiverPortalPage from './pages/caregiver-portal/CaregiverPortalPage';
import CaregiverAckPage from './pages/caregiver-ack/CaregiverAckPage';
import AdherenceReportPage from './pages/reports/AdherenceReportPage';
import RequisitionManifestPage from './pages/reports/RequisitionManifestPage';
import ProfileSetupPage from './pages/profile/ProfileSetupPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Frictionless One-Click Caregiver Ack (Public, Token Signed) */}
          <Route path="/caregiver/ack/:token" element={<CaregiverAckPage />} />

          {/* Protected Application Workspace */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="medications" element={<MedicationListPage />} />
            <Route path="regimens" element={<RegimenListPage />} />
            <Route path="caregivers" element={<CaregiverListPage />} />
            <Route path="caregiver/portal" element={<CaregiverPortalPage />} />
            <Route path="reports/adherence" element={<AdherenceReportPage />} />
            <Route path="reports/requisition" element={<RequisitionManifestPage />} />
            <Route path="profile" element={<ProfileSetupPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
