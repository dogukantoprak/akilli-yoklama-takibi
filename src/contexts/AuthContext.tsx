import React, { createContext, useContext, useMemo, useState } from 'react';
import { fallbackAvatar } from '@/lib/avatar';

type Role = 'admin' | 'teacher' | 'student' | string;

type UserProfile = {
  username: string;
  name: string;
  role: Role;
  avatarUrl: string;
};

interface AuthContextShape {
  isLoggedIn: boolean;
  user?: string;
  role?: Role;
  profile?: UserProfile;
  login: (
    username: string,
    _password: string,
    role: Role,
    profileOverride?: Partial<UserProfile>,
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);

  const userDirectory: UserProfile[] = [
    {
      username: 'admin',
      name: 'Admin Kullanici',
      role: 'admin',
      avatarUrl: fallbackAvatar,
    },
    {
      username: 'egitmen',
      name: 'Dr. Ayse Kaya',
      role: 'teacher',
      avatarUrl: fallbackAvatar,
    },
    {
      username: 'ahmet',
      name: 'Prof. Dr. Ahmet Yilmaz',
      role: 'teacher',
      avatarUrl: fallbackAvatar,
    },
    {
      username: 'mehmet',
      name: 'Prof. Dr. Mehmet Demir',
      role: 'teacher',
      avatarUrl: fallbackAvatar,
    },
    {
      username: 'zeynep',
      name: 'Dr. Zeynep Sahin',
      role: 'teacher',
      avatarUrl: fallbackAvatar,
    },
    {
      username: '20210001234',
      name: 'Ahmet Yilmaz',
      role: 'student',
      avatarUrl: fallbackAvatar,
    },
    {
      username: '20210001235',
      name: 'Ayse Kaya',
      role: 'student',
      avatarUrl: fallbackAvatar,
    },
  ];

  const resolveUserProfile = (username: string, nextRole: Role): UserProfile => {
    const normalized = username.trim().toLowerCase();
    const matched = userDirectory.find(
      (entry) =>
        entry.username === normalized ||
        entry.name.toLowerCase() === normalized,
    );

    if (matched) {
      return {
        ...matched,
        username: username || matched.username,
      };
    }

    const trimmed = username.trim();
    const fallbackName = trimmed.includes(' ') ? trimmed : 'Kullanici';
    return {
      username: username || fallbackName,
      name: fallbackName,
      role: nextRole,
      avatarUrl: fallbackAvatar,
    };
  };

  const login = (
    username: string,
    _password: string,
    nextRole: Role,
    profileOverride?: Partial<UserProfile>,
  ) => {
    setUser(username);
    setRole(nextRole);
    const baseProfile = resolveUserProfile(username, nextRole);
    setProfile({
      ...baseProfile,
      ...profileOverride,
      username: profileOverride?.username ?? baseProfile.username,
      name: profileOverride?.name ?? baseProfile.name,
      role: profileOverride?.role ?? baseProfile.role,
      avatarUrl: profileOverride?.avatarUrl ?? baseProfile.avatarUrl,
    });
  };

  const logout = () => {
    setUser(undefined);
    setRole(undefined);
    setProfile(undefined);
  };

  const value = useMemo<AuthContextShape>(
    () => ({
      isLoggedIn: Boolean(user),
      user,
      role,
      profile,
      login,
      logout,
    }),
    [user, role, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  // Safe fallback to prevent runtime crashes if provider is missing.
  return {
    isLoggedIn: false,
    user: undefined,
    role: undefined,
    profile: undefined,
    login: () => undefined,
    logout: () => undefined,
  };
}
