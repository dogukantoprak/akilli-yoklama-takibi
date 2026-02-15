import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fallbackAvatar } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';

type TopBarProps = {
  className?: string;
};

export default function TopBar({ className }: TopBarProps) {
  const { profile, user } = useAuth();

  const displayName = useMemo(() => {
    if (profile?.name) return profile.name;
    if (user && user.includes(' ')) return user;
    return 'Kullanici';
  }, [profile?.name, user]);

  const avatarUrl = profile?.avatarUrl || fallbackAvatar;

  return (
    <div className={cn('flex items-center justify-end gap-4', className)}>
      <ThemeToggle />
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <img
          src={avatarUrl}
          alt={`${displayName} profil fotografi`}
          className="h-8 w-8 rounded-full object-cover border border-gray-200"
        />
        <span className="text-sm font-semibold text-gray-900">{displayName}</span>
      </div>
    </div>
  );
}
