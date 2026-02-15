import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navigationByRole = {
  admin: [
    { label: 'Ana Panel', to: '/dashboard/admin' },
    { label: 'Ogrenciler', to: '/students' },
    { label: 'Dersler', to: '/courses' },
    { label: 'Ogretmenler', to: '/teachers' },
    { label: 'Yoklamalar', to: '/attendance' },
    { label: 'Cihazlar', to: '/devices' },
  ],
  teacher: [
    { label: 'Ana Panel', to: '/dashboard/teacher' },
    { label: 'Dersler', to: '/courses' },
    { label: 'Yoklamalar', to: '/attendance' },
  ],
  student: [{ label: 'Ana Panel', to: '/dashboard/student' }],
};


export default function Sidebar() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const navItems = navigationByRole[role ?? 'student'] ?? navigationByRole.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-blue-700 text-white h-screen fixed left-0 top-0 shadow-lg">
      <div className="px-6 py-5 border-b border-blue-600">
        <h1 className="text-xl font-bold leading-tight">Akıllı Yoklama</h1>
        <p className="text-xs text-blue-100">Kontrol Paneli</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'mx-3 flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-50 hover:bg-blue-600 hover:text-white',
                    isActive && 'bg-blue-500 text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-6 py-4 border-t border-blue-600 space-y-3">
        <button
          className="w-full rounded-lg bg-white text-blue-700 font-semibold py-2 hover:bg-blue-50 transition-colors"
          onClick={handleLogout}
        >
          Çıkış yap
        </button>
        <div className="text-xs text-blue-100">© {new Date().getFullYear()} Akıllı Yoklama</div>
      </div>
    </aside>
  );
}
