import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { ParentUser } from '@/types/kid';
import { DEFAULT_PARENTS } from '@/constants/users';

const AUTH_STORAGE_KEY = 'kids_ai_parent_auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ParentUser;
          console.log('[Auth] Restored parent session:', parsed.username);
          setUser(parsed);
        }
      } catch (error) {
        console.error('[Auth] Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    console.log('[Auth] Attempting parent login:', username);
    const found = DEFAULT_PARENTS.find((u) => u.username === username && u.password === password);

    if (!found) {
      return { success: false, message: 'שם משתמש או סיסמה שגויים' };
    }

    const userData: ParentUser = {
      username: found.username,
      name: found.name,
      email: found.email,
    };

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      return { success: true, message: 'התחברת בהצלחה' };
    } catch (error) {
      console.error('[Auth] Failed to save user:', error);
      return { success: false, message: 'שגיאה בשמירת הנתונים' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Failed to logout:', error);
    }
  }, []);

  return { user, isLoading, login, logout };
});
