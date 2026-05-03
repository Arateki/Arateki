import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  // Currently just redirecting to orders as it's the main view
  return <Navigate to="/manage/orders" replace />;
}
