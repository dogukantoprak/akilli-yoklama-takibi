import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'admin' | 'teacher' | 'student' | string;

type RoleRouteProps = {
  allowedRoles: Role[];
  children: ReactElement;
};

export default function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
