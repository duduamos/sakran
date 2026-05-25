import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { KidProfile, QuestionRecord, KidAge, InterestTag } from '@/types/kid';
import { makeMockRecord } from '@/constants/mockAnswers';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const AVATAR_OPTIONS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦁', '🐨'];

function pickAvatar(): string {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
}

function historyKey(parentId: string): string {
  return `sakran_history_${parentId}`;
}

function activeKidKey(parentId: string): string {
  return `sakran_active_kid_${parentId}`;
}

interface KidRow {
  id: string;
  parent_id: string;
  name: string;
  age: number;
  interests: string[];
  avatar: string | null;
  created_at: string;
}

function fromRow(row: KidRow): KidProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age as KidAge,
    interests: row.interests as InterestTag[],
    avatar: row.avatar ?? pickAvatar(),
    createdAt: row.created_at,
  };
}

export const [KidProvider, useKid] = createContextHook(() => {
  const { user } = useAuth();
  const parentId = user?.id ?? null;

  const [kids, setKids] = useState<KidProfile[]>([]);
  const [activeKid, setActiveKidState] = useState<KidProfile | null>(null);
  const [history, setHistory] = useState<QuestionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reload kids + per-parent local state whenever the signed-in parent changes
  useEffect(() => {
    let cancelled = false;

    const reset = () => {
      if (cancelled) return;
      setKids([]);
      setActiveKidState(null);
      setHistory([]);
      setIsLoading(false);
    };

    if (!parentId) {
      reset();
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    const load = async () => {
      try {
        const [{ data, error }, storedActive, storedHistory] = await Promise.all([
          supabase
            .from('kids')
            .select('id, parent_id, name, age, interests, avatar, created_at')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true }),
          AsyncStorage.getItem(activeKidKey(parentId)),
          AsyncStorage.getItem(historyKey(parentId)),
        ]);

        if (cancelled) return;

        if (error) {
          console.error('[Kid] Failed to load kids:', error.message);
          setKids([]);
        } else {
          const list = (data ?? []).map((r) => fromRow(r as KidRow));
          setKids(list);
          const storedId = storedActive ? (JSON.parse(storedActive) as string) : null;
          const pick = list.find((k) => k.id === storedId) ?? list[0] ?? null;
          setActiveKidState(pick);
        }

        if (storedHistory) {
          try {
            setHistory(JSON.parse(storedHistory) as QuestionRecord[]);
          } catch {
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [parentId]);

  const setActiveKid = useCallback(
    async (kid: KidProfile | null) => {
      setActiveKidState(kid);
      if (!parentId) return;
      if (kid) {
        await AsyncStorage.setItem(activeKidKey(parentId), JSON.stringify(kid.id));
      } else {
        await AsyncStorage.removeItem(activeKidKey(parentId));
      }
    },
    [parentId]
  );

  const createKid = useCallback(
    async (name: string, age: KidAge, interests: InterestTag[]): Promise<KidProfile> => {
      if (!parentId) throw new Error('Not signed in');
      const avatar = pickAvatar();
      const { data, error } = await supabase
        .from('kids')
        .insert({
          parent_id: parentId,
          name: name.trim(),
          age,
          interests,
          avatar,
        })
        .select('id, parent_id, name, age, interests, avatar, created_at')
        .single();
      if (error || !data) {
        console.error('[Kid] createKid failed:', error?.message);
        throw new Error(error?.message ?? 'Failed to create kid');
      }
      const kid = fromRow(data as KidRow);
      setKids((prev) => [...prev, kid]);
      await setActiveKid(kid);
      return kid;
    },
    [parentId, setActiveKid]
  );

  const updateKid = useCallback(
    async (patch: Partial<Omit<KidProfile, 'id' | 'createdAt'>>) => {
      if (!activeKid || !parentId) return;
      const { data, error } = await supabase
        .from('kids')
        .update({
          name: patch.name,
          age: patch.age,
          interests: patch.interests,
          avatar: patch.avatar,
        })
        .eq('id', activeKid.id)
        .eq('parent_id', parentId)
        .select('id, parent_id, name, age, interests, avatar, created_at')
        .single();
      if (error || !data) {
        console.error('[Kid] updateKid failed:', error?.message);
        return;
      }
      const updated = fromRow(data as KidRow);
      setKids((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
      setActiveKidState(updated);
    },
    [activeKid, parentId]
  );

  const deleteActiveKid = useCallback(async () => {
    if (!activeKid || !parentId) return;
    const { error } = await supabase
      .from('kids')
      .delete()
      .eq('id', activeKid.id)
      .eq('parent_id', parentId);
    if (error) {
      console.error('[Kid] deleteActiveKid failed:', error.message);
      throw new Error(error.message);
    }
    const remaining = kids.filter((k) => k.id !== activeKid.id);
    setKids(remaining);
    await setActiveKid(remaining[0] ?? null);
    setHistory([]);
    await AsyncStorage.removeItem(historyKey(parentId));
  }, [activeKid, kids, parentId, setActiveKid]);

  const askQuestion = useCallback(
    async (question: string): Promise<QuestionRecord> => {
      if (!activeKid || !parentId) {
        throw new Error('No active kid profile');
      }
      const base = makeMockRecord(activeKid.id, question, activeKid.age);
      const record: QuestionRecord = {
        ...base,
        id: `q_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const next = [record, ...history].slice(0, 200);
      setHistory(next);
      await AsyncStorage.setItem(historyKey(parentId), JSON.stringify(next));
      return record;
    },
    [activeKid, history, parentId]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!parentId) return;
      const next = history.filter((r) => r.id !== id);
      setHistory(next);
      await AsyncStorage.setItem(historyKey(parentId), JSON.stringify(next));
    },
    [history, parentId]
  );

  return useMemo(
    () => ({
      activeKid,
      kids,
      history,
      isLoading,
      createKid,
      updateKid,
      setActiveKid,
      deleteActiveKid,
      askQuestion,
      deleteRecord,
    }),
    [
      activeKid,
      kids,
      history,
      isLoading,
      createKid,
      updateKid,
      setActiveKid,
      deleteActiveKid,
      askQuestion,
      deleteRecord,
    ]
  );
});
