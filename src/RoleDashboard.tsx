import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleDashboard() {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'teacher') {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  if (role === 'student') {
    return <Navigate to="/dashboard/student" replace />;
  }

  return <Navigate to="/dashboard/admin" replace />;
}
