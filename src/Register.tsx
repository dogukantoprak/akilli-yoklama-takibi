import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Status = {
  type: 'success' | 'error';
  message: string;
};

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [status, setStatus] = useState<Status | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, role: authRole } = useAuth();
  const isAdmin = isLoggedIn && authRole === 'admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setStatus({ type: 'error', message: 'Lutfen tum alanlari doldurun.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          username,
          email,
          password,
          role,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus({ type: 'error', message: data?.error ?? 'Kayit basarisiz.' });
        return;
      }
      setStatus({ type: 'success', message: 'Kayit basarili. Giris yapabilirsiniz.' });
    } catch (_error) {
      setStatus({ type: 'error', message: 'Sunucuya baglanilamadi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Registration Disabled</h1>
          <p className="text-sm text-gray-600">
            Registration is only available for admins. Please log in as admin.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kayit Ol</h1>
          <p className="text-gray-500 text-sm">Yeni hesap olustur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {status && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                status.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-green-200 bg-green-50 text-green-700'
              }`}
            >
              {status.message}
            </div>
          )}
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Ad Soyad
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Ad soyad giriniz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Kullanici Adi
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Kullanici adinizi giriniz"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-posta
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@site.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Sifre
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Sifrenizi giriniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
                <SelectItem value="teacher">Ogretmen</SelectItem>
                <SelectItem value="student">Ogrenci</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kayit Yapiliyor...' : 'Kayit Ol'}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Giris sayfasina don
          </button>
        </form>
      </div>
    </div>
  );
}
