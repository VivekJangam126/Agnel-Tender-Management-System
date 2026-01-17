import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  const normalizedAllowed = allowedRoles?.map((r) => r?.toLowerCase());
  const userRole = user?.role ? user.role.toLowerCase() : null;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
