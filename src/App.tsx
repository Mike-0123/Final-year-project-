import { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import DemoDashboard from './pages/DemoDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SimulationPage from './pages/SimulationPage';
import { Role, User } from './types';
import { getToken, getUser } from './services/storage';

interface ProtectedRouteProps {
  children: ReactElement;
  role?: Role;
}

function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const token = getToken();
  const user: Partial<User> = getUser<User>() || {};
  if (!token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role ?? 'login'}`} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/supplier" element={
          <ProtectedRoute role="supplier">
            <SupplierDashboard />
          </ProtectedRoute>
        } />
        <Route path="/seller" element={
          <ProtectedRoute role="seller">
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/demo" element={<DemoDashboard />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
