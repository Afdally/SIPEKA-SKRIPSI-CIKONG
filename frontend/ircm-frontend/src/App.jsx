import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardDP3A from './pages/DashboardDP3A';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';

// Auth Guard sederhana
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('sipeka_token');
  const rawUser = localStorage.getItem('sipeka_user');
  
  if (!token || !rawUser) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(rawUser);
    if (allowedRole && user.role !== allowedRole) {
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    localStorage.removeItem('sipeka_token');
    localStorage.removeItem('sipeka_user');
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard Petugas UPTD PPA */}
        <Route 
          path="/dashboard-dp3a" 
          element={
            <ProtectedRoute allowedRole="petugas_uptd">
              <DashboardDP3A />
            </ProtectedRoute>
          } 
        />

        {/* Dashboard Super Admin */}
        <Route 
          path="/superadmin" 
          element={
            <ProtectedRoute allowedRole="super_admin">
              <DashboardSuperAdmin />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
