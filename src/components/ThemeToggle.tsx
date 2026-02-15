import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'app-theme';

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
};

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export default function ThemeToggle({
  className,
  showLabel = true,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const label = theme === 'dark' ? 'Koyu Tema' : 'Acik Tema';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm',
        className,
      )}
    >
      {showLabel && (
        <span className="text-xs font-medium text-gray-500">{label}</span>
      )}
      <button
        type="button"
        aria-label="Tema degistir"
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full border border-gray-200 bg-gray-200 transition-colors',
          theme === 'dark' && 'bg-gray-900 border-gray-700',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-slate-100 shadow transition-transform',
            theme === 'dark' ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}
