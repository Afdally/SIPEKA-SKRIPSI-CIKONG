import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardDP3A from './pages/DashboardDP3A';
import DashboardKelurahan from './pages/DashboardKelurahan';

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
      if (user.role === 'admin_dp3a') return <Navigate to="/dashboard-dp3a" replace />;
      if (user.role === 'admin_kelurahan') return <Navigate to="/dashboard-kelurahan" replace />;
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
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard-dp3a" 
          element={
            <ProtectedRoute allowedRole="admin_dp3a">
              <DashboardDP3A />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard-kelurahan" 
          element={
            <ProtectedRoute allowedRole="admin_kelurahan">
              <DashboardKelurahan />
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
