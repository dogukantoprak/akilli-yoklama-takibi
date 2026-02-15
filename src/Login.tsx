import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.user) {
        setError(data?.error ?? 'Giris basarisiz.');
        return;
      }

      const userData = data.user;
      const nextRole = userData.role ?? role;
      login(userData.username ?? username, password, nextRole, {
        username: userData.username ?? username,
        name: userData.full_name ?? userData.username ?? username,
        role: nextRole,
        avatarUrl: userData.avatar_url,
      });

      const nextPath =
        nextRole === 'teacher'
          ? '/dashboard/teacher'
          : nextRole === 'student'
          ? '/dashboard/student'
          : '/dashboard/admin';
      navigate(nextPath);
    } catch (_error) {
      setError('Sunucuya baglanilamadi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Akıllı Yoklama Sistemi
          </h1>
          <p className="text-gray-500 text-sm">Lütfen giriş yapınız</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Kullanıcı adınızı giriniz"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Şifre
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Şifrenizi giriniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Sifremi Unuttum
            </button>
          </div>

          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Rol
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Öğretmen</SelectItem>
                <SelectItem value="student">Öğrenci</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            disabled={isSubmitting}
          >
            Giriş Yap
          </Button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full rounded-md border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Kayit Ol
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-center text-xs text-gray-600 font-semibold mb-2">
            Demo Hesaplar:
          </p>
          <div className="space-y-1 text-xs text-gray-700">
            <p>
              Admin: <span className="font-semibold">admin</span> / <span className="font-semibold">admin</span> (Rol: Admin)
            </p>
            <p>
              Öğretmen: <span className="font-semibold">egitmen</span> / <span className="font-semibold">egitmen</span> (Rol: Öğretmen)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
