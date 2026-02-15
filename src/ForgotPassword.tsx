import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Step = 'request' | 'reset';

type Status = {
  type: 'success' | 'error';
  message: string;
};

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: 'error', message: 'Lutfen e-posta girin.' });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus({ type: 'error', message: data?.error ?? 'Islem basarisiz.' });
        return;
      }
      setStatus({
        type: 'success',
        message:
          'Sifre yenileme istegi alindi. Kodunuz varsa asagidan sifreyi guncelleyebilirsiniz.',
      });
      setStep('reset');
    } catch (_error) {
      setStatus({ type: 'error', message: 'Sunucuya baglanilamadi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'Lutfen tum alanlari doldurun.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Sifreler ayni olmali.' });
      return;
    }
    if (!email) {
      setStatus({ type: 'error', message: 'E-posta bilgisi eksik.' });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email,
          code: resetCode,
          new_password: newPassword,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus({ type: 'error', message: data?.error ?? 'Islem basarisiz.' });
        return;
      }
      setStatus({
        type: 'success',
        message: 'Sifre guncellendi. Giris yapabilirsiniz.',
      });
    } catch (_error) {
      setStatus({ type: 'error', message: 'Sunucuya baglanilamadi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sifre Yenile</h1>
          <p className="text-gray-500 text-sm">
            E-posta gonder ve gelen kodla yeni sifre belirle.
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="space-y-6">
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

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Gonderiliyor...' : 'Sifre yenileme linki gonder'}
            </Button>

            <button
              type="button"
              onClick={() => setStep('reset')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Kodum var, sifreyi guncelle
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-6">
            <div>
              <Label htmlFor="resetCode" className="text-sm font-medium text-gray-700">
                Dogrulama Kodu
              </Label>
              <Input
                id="resetCode"
                type="text"
                placeholder="Kodu giriniz"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Yeni Sifre
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Yeni sifrenizi giriniz"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Yeni Sifre (Tekrar)
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Yeni sifreyi tekrar giriniz"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guncelleniyor...' : 'Sifreyi guncelle'}
            </Button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              E-postayi tekrar gonder
            </button>
          </form>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Giris sayfasina don
          </button>
        </div>
      </div>
    </div>
  );
}
