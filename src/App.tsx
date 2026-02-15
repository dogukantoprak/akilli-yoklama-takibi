import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import Students from './Students';
import Courses from './Courses';
import Teachers from './Teachers';
import Attendance from './Attendance';
import Devices from './Devices';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import NotFound from './NotFound';
import RoleDashboard from './RoleDashboard';
import RoleRoute from './components/RoleRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<RoleDashboard />} />
      <Route
        path="/dashboard/admin"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Dashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/teacher"
        element={
          <RoleRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <RoleRoute allowedRoles={['student']}>
            <StudentDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/students"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Students />
          </RoleRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <RoleRoute allowedRoles={['admin', 'teacher']}>
            <Courses />
          </RoleRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Teachers />
          </RoleRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <RoleRoute allowedRoles={['admin', 'teacher']}>
            <Attendance />
          </RoleRoute>
        }
      />
      <Route
        path="/devices"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Devices />
          </RoleRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
