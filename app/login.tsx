import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'נא למלא אימייל וסיסמה');
      shake();
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        Alert.alert('שגיאה', result.message);
        shake();
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      Alert.alert('שגיאה', 'שגיאה בהתחברות');
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
        style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Sparkles size={44} color={Colors.accent} />
            </View>
            <Text style={styles.title}>סקרן</Text>
            <Text style={styles.subtitle}>עוזר AI לילדים סקרנים</Text>
            <Text style={styles.parentTag}>כניסה להורים</Text>
          </View>

          <Animated.View style={[styles.formCard, { transform: [{ translateX: shakeAnim }] }]}>
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
                testID="login-email"
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="סיסמה"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
                testID="login-password"
              />
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            testID="login-submit"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>כניסה</Text>
                <ChevronLeft size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/signup' as any)}
            style={styles.signupLink}
            testID="login-go-signup"
          >
            <Text style={styles.signupLinkText}>
              אין לך חשבון? <Text style={styles.signupLinkBold}>הירשם כהורה</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  content: { alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: '800' as const, color: Colors.white, marginBottom: 6 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
  parentTag: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 18,
    shadowColor: Colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 14, gap: 12 },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  separator: { height: 1, backgroundColor: Colors.divider },
  loginButton: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: Colors.white, fontSize: 18, fontWeight: '700' as const },
  signupLink: { marginTop: 22 },
  signupLinkText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  signupLinkBold: { color: Colors.white, fontWeight: '800' as const },
});
