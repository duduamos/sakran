import { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ParentUser } from '@/types/kid';

export interface AuthResult {
  success: boolean;
  message: string;
  needsEmailConfirmation?: boolean;
}

function toParentUser(authUser: User | null, fullName: string | null): ParentUser | null {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name: fullName ?? authUser.user_metadata?.full_name ?? authUser.email ?? 'הורה',
    emailVerified: Boolean(authUser.email_confirmed_at),
  };
}

async function loadProfileName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('parent_profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[Auth] Failed to load parent profile:', error.message);
    return null;
  }
  return data?.full_name ?? null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const hydrate = async (s: Session | null) => {
      if (!s?.user) {
        if (active) {
          setSession(null);
          setUser(null);
        }
        return;
      }
      const name = await loadProfileName(s.user.id);
      if (!active) return;
      setSession(s);
      setUser(toParentUser(s.user, name));
    };

    supabase.auth
      .getSession()
      .then(({ data }) => hydrate(data.session))
      .catch((error) => console.error('[Auth] getSession failed:', error))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void hydrate(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      ageAttested: boolean,
      termsAccepted: boolean
    ): Promise<AuthResult> => {
      if (!isSupabaseConfigured) {
        return { success: false, message: 'השירות עדיין לא הוגדר. נסה שוב עוד רגע.' };
      }
      if (!ageAttested || !termsAccepted) {
        return { success: false, message: 'יש לאשר שאתה מעל גיל 18 ולקבל את התנאים' };
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            age_attested: true,
            terms_accepted: true,
          },
        },
      });
      if (error) {
        return { success: false, message: translateError(error.message) };
      }
      const needsConfirmation = !data.session;
      return {
        success: true,
        message: needsConfirmation
          ? 'נשלח אליך מייל לאימות. אשר אותו כדי להמשיך.'
          : 'נרשמת בהצלחה',
        needsEmailConfirmation: needsConfirmation,
      };
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'השירות עדיין לא הוגדר. נסה שוב עוד רגע.' };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { success: false, message: translateError(error.message) };
    }
    return { success: true, message: 'התחברת בהצלחה' };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Auth] signOut failed:', error.message);
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    if (error) return { success: false, message: translateError(error.message) };
    return { success: true, message: 'נשלח מייל חדש' };
  }, []);

  return {
    user,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
  };
});

function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login')) return 'אימייל או סיסמה שגויים';
  if (lower.includes('email not confirmed')) return 'יש לאמת קודם את האימייל';
  if (lower.includes('already registered') || lower.includes('user already')) {
    return 'האימייל הזה כבר רשום. נסה להתחבר.';
  }
  if (lower.includes('password should be')) return 'הסיסמה חייבת להיות לפחות 6 תווים';
  if (lower.includes('rate limit')) return 'יותר מדי ניסיונות. המתן רגע ונסה שוב.';
  return msg;
}
