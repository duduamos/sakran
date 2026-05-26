import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useKid } from '@/contexts/KidContext';
import { AnswerCard } from '@/components/AnswerCard';
import { SUGGESTED_QUESTIONS_BY_AGE } from '@/constants/mockAnswers';
import { QuestionRecord } from '@/types/kid';

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const { activeKid, askQuestion } = useKid();
  const [input, setInput] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<QuestionRecord | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!activeKid) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const suggestions = SUGGESTED_QUESTIONS_BY_AGE[activeKid.age];

  const handleAsk = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || isThinking) return;
    setIsThinking(true);
    setInput('');
    try {
      await new Promise((r) => setTimeout(r, 700));
      const record = await askQuestion(question);
      setCurrentAnswer(record);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } catch (error) {
      console.error('[Ask] failed:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleNewQuestion = () => {
    setCurrentAnswer(null);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.avatar}>{activeKid.avatar}</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.greeting}>שלום, {activeKid.name}!</Text>
            <Text style={styles.greetingSub}>מה מעניין אותך היום?</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {!currentAnswer && !isThinking && (
          <View style={styles.welcomeCard}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Sparkles size={56} color={Colors.accent} />
            </Animated.View>
            <Text style={styles.welcomeTitle}>שאל אותי כל דבר!</Text>
            <Text style={styles.welcomeText}>
              אני יכול לעזור עם שאלות על העולם, חיות, חלל, היסטוריה ועוד.
            </Text>

            <Text style={styles.suggestionsLabel}>נסה את אלה:</Text>
            <View style={styles.suggestionsList}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleAsk(s)}
                  testID={`suggestion-${s}`}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isThinking && (
          <View style={styles.thinkingCard}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Sparkles size={36} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.thinkingText}>חושב...</Text>
          </View>
        )}

        {currentAnswer && !isThinking && (
          <>
            <AnswerCard record={currentAnswer} />
            <TouchableOpacity
              style={styles.askAgainButton}
              onPress={handleNewQuestion}
              testID="ask-again"
            >
              <Text style={styles.askAgainText}>שאלה חדשה</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isThinking) && styles.sendButtonDisabled]}
          onPress={() => handleAsk()}
          disabled={!input.trim() || isThinking}
          testID="send-question"
        >
          <Send size={22} color={Colors.white} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="שאל אותי שאלה..."
          placeholderTextColor={Colors.textLight}
          value={input}
          onChangeText={setInput}
          textAlign="right"
          multiline
          maxLength={200}
          testID="question-input"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  avatar: { fontSize: 40 },
  greeting: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  greetingSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  welcomeCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: 22,
    marginBottom: 10,
  },
  suggestionsList: { width: '100%', gap: 10 },
  suggestionChip: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  suggestionText: { fontSize: 15, color: Colors.text, textAlign: 'right', fontWeight: '500' as const },
  thinkingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  thinkingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  askAgainButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  askAgainText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
  inputBar: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.textLight },
});
