import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Mail, Lock, User, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [adult, setAdult] = useState<boolean>(false);
  const [terms, setTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes('@') &&
    password.length >= 6 &&
    adult &&
    terms;

  const handleSignup = async () => {
    if (!canSubmit) {
      Alert.alert('כמעט שם', 'מלא את כל השדות ואשר את התנאים');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp(email, password, fullName, adult, terms);
      if (!result.success) {
        Alert.alert('שגיאה', result.message);
        return;
      }
      if (result.needsEmailConfirmation) {
        Alert.alert('כמעט סיימנו', result.message, [
          { text: 'הבנתי', onPress: () => router.replace('/login' as any) },
        ]);
      }
    } catch (error) {
      console.error('[Signup] Error:', error);
      Alert.alert('שגיאה', 'שגיאה ברישום');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.pink]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={10}
            testID="signup-back"
          >
            <ChevronRight size={22} color={Colors.white} />
            <Text style={styles.backText}>חזרה</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Sparkles size={36} color={Colors.accent} />
            </View>
            <Text style={styles.title}>הרשמת הורה</Text>
            <Text style={styles.subtitle}>חשבון אחד לכל הילדים במשפחה</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="שם מלא"
                placeholderTextColor={Colors.textLight}
                value={fullName}
                onChangeText={setFullName}
                textAlign="right"
                testID="signup-name"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="אימייל"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textAlign="right"
                testID="signup-email"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="סיסמה (לפחות 6 תווים)"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
                testID="signup-password"
              />
            </View>
          </View>

          <Checkbox
            checked={adult}
            onToggle={() => setAdult((v) => !v)}
            label="אני מעל גיל 18"
            testID="signup-adult"
          />
          <Checkbox
            checked={terms}
            onToggle={() => setTerms((v) => !v)}
            label="אני מסכים לתנאי השימוש ולמדיניות הפרטיות, ומאשר כהורה את שימוש הילד באפליקציה"
            testID="signup-terms"
          />

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || isLoading) && styles.submitDisabled]}
            onPress={handleSignup}
            disabled={!canSubmit || isLoading}
            activeOpacity={0.85}
            testID="signup-submit"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitText}>צור חשבון</Text>
                <ChevronLeft size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            לאחר ההרשמה תקבל מייל לאימות הכתובת. עד לאימות לא תוכל להתחבר.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testID?: string;
}

function Checkbox({ checked, onToggle, label, testID }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onToggle}
      activeOpacity={0.7}
      testID={testID}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Check size={16} color={Colors.white} strokeWidth={3} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  backText: { color: Colors.white, fontWeight: '600' as const, fontSize: 14 },
  logoContainer: { alignItems: 'center', marginTop: 12, marginBottom: 28 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.white, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  separator: { height: 1, backgroundColor: Colors.divider },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxLabel: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Colors.white, fontSize: 18, fontWeight: '700' as const },
  legal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 18,
  },
});
