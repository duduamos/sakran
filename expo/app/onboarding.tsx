import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { INTERESTS, InterestTag, KidAge } from '@/types/kid';
import { useKid } from '@/contexts/KidContext';
import { useAuth } from '@/contexts/AuthContext';

const AGES: KidAge[] = [5, 6, 7, 8, 9, 10];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { createKid } = useKid();
  const { logout, user } = useAuth();
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<KidAge | null>(null);
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const toggleInterest = (tag: InterestTag) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canSubmit = name.trim().length >= 2 && age !== null && interests.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || age === null) {
      Alert.alert('כמעט שם', 'מלא שם, בחר גיל ולפחות תחום עניין אחד');
      return;
    }
    setIsSaving(true);
    try {
      await createKid(name.trim(), age, interests);
    } catch (error) {
      console.error('[Onboarding] failed:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הפרופיל');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.background, '#fff5fb']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={logout} hitSlop={10} testID="onboarding-logout">
            <Text style={styles.logoutText}>יציאה</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Sparkles size={28} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>שלום, {user?.name ?? 'הורה'}!</Text>
        <Text style={styles.subtitle}>בואו ניצור את הפרופיל של הילד</Text>

        <View style={styles.section}>
          <Text style={styles.label}>שם הילד</Text>
          <TextInput
            style={styles.input}
            placeholder="לדוגמה: יואב"
            placeholderTextColor={Colors.textLight}
            value={name}
            onChangeText={setName}
            textAlign="right"
            maxLength={20}
            testID="onboarding-name"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>גיל</Text>
          <View style={styles.ageRow}>
            {AGES.map((a) => {
              const active = age === a;
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAge(a)}
                  style={[styles.ageChip, active && styles.ageChipActive]}
                  testID={`onboarding-age-${a}`}
                >
                  <Text style={[styles.ageChipText, active && styles.ageChipTextActive]}>{a}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>תחומי עניין (בחר 1 או יותר)</Text>
          <View style={styles.interestGrid}>
            {INTERESTS.map((it) => {
              const active = interests.includes(it.tag);
              return (
                <TouchableOpacity
                  key={it.tag}
                  onPress={() => toggleInterest(it.tag)}
                  style={[styles.interestPill, active && styles.interestPillActive]}
                  testID={`onboarding-interest-${it.tag}`}
                >
                  <Text style={styles.interestEmoji}>{it.emoji}</Text>
                  <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                    {it.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, !canSubmit && styles.ctaDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSaving}
          activeOpacity={0.85}
          testID="onboarding-submit"
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.ctaText}>בואו נתחיל!</Text>
              <ChevronLeft size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          המידע נשמר רק במכשיר שלך ובהסכמתך. ניתן לשנות בכל עת.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { flex: 1, alignItems: 'flex-end' },
  logoutText: { color: Colors.primary, fontWeight: '600' as const, fontSize: 14 },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, marginTop: 16, textAlign: 'right' },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 6, marginBottom: 24, textAlign: 'right' },
  section: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 10, textAlign: 'right' },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ageRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  ageChip: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ageChipText: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  ageChipTextActive: { color: Colors.white },
  interestGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  interestPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  interestPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  interestEmoji: { fontSize: 20 },
  interestLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  interestLabelActive: { color: Colors.white },
  cta: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: Colors.white, fontSize: 18, fontWeight: '700' as const },
  note: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
