import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/manage/login" replace />;
  }

  return <Outlet />;
};
