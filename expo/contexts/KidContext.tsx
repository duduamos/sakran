import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { KidProfile, QuestionRecord, KidAge, InterestTag } from '@/types/kid';
import { makeMockRecord } from '@/constants/mockAnswers';

const KID_PROFILE_KEY = 'kids_ai_active_kid';
const HISTORY_KEY = 'kids_ai_history';

const AVATAR_OPTIONS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦁', '🐨'];

function pickAvatar(): string {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
}

export const [KidProvider, useKid] = createContextHook(() => {
  const [activeKid, setActiveKid] = useState<KidProfile | null>(null);
  const [history, setHistory] = useState<QuestionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedKid, storedHistory] = await Promise.all([
          AsyncStorage.getItem(KID_PROFILE_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        if (storedKid) setActiveKid(JSON.parse(storedKid) as KidProfile);
        if (storedHistory) setHistory(JSON.parse(storedHistory) as QuestionRecord[]);
      } catch (error) {
        console.error('[Kid] Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const createKid = useCallback(
    async (name: string, age: KidAge, interests: InterestTag[]): Promise<KidProfile> => {
      const kid: KidProfile = {
        id: `kid_${Date.now()}`,
        name: name.trim(),
        age,
        interests,
        avatar: pickAvatar(),
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(KID_PROFILE_KEY, JSON.stringify(kid));
      setActiveKid(kid);
      return kid;
    },
    []
  );

  const updateKid = useCallback(
    async (patch: Partial<Omit<KidProfile, 'id' | 'createdAt'>>) => {
      if (!activeKid) return;
      const updated: KidProfile = { ...activeKid, ...patch };
      await AsyncStorage.setItem(KID_PROFILE_KEY, JSON.stringify(updated));
      setActiveKid(updated);
    },
    [activeKid]
  );

  const clearKid = useCallback(async () => {
    await AsyncStorage.multiRemove([KID_PROFILE_KEY, HISTORY_KEY]);
    setActiveKid(null);
    setHistory([]);
  }, []);

  const askQuestion = useCallback(
    async (question: string): Promise<QuestionRecord> => {
      if (!activeKid) {
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
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return record;
    },
    [activeKid, history]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      const next = history.filter((r) => r.id !== id);
      setHistory(next);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    },
    [history]
  );

  return {
    activeKid,
    history,
    isLoading,
    createKid,
    updateKid,
    clearKid,
    askQuestion,
    deleteRecord,
  };
});
