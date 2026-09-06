'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface UserSession {
  id: string;
  name: string;
  role: 'OWNER' | 'KARYAWAN';
  createdAt?: string;
}

interface UserContextType {
  user: UserSession | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitialUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && !ignore) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        console.error('Failed to fetch user session:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialUser();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
