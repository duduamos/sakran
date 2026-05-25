import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  RefreshCw,
  Calendar,
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useKid } from '@/contexts/KidContext';
import { INTERESTS } from '@/types/kid';

export default function ParentScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { activeKid, history, deleteActiveKid } = useKid();

  const stats = useMemo(() => {
    if (!history.length) return null;
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const today = history.filter((h) => new Date(h.createdAt).getTime() >= dayAgo).length;
    const week = history.filter((h) => new Date(h.createdAt).getTime() >= weekAgo).length;

    const topicCounts: Record<string, number> = {};
    for (const h of history) {
      topicCounts[h.topic] = (topicCounts[h.topic] ?? 0) + 1;
    }
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { total: history.length, today, week, topTopics };
  }, [history]);

  const handleResetProfile = () => {
    Alert.alert(
      'מחיקת פרופיל',
      'פעולה זו תמחק את הפרופיל וההיסטוריה. להמשיך?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => deleteActiveKid() },
      ]
    );
  };

  const interestLabels = activeKid
    ? INTERESTS.filter((it) => activeKid.interests.includes(it.tag))
    : [];

  const recentParentPrompts = history.slice(0, 5).filter((h) => h.parentPrompt);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={signOut} hitSlop={10} testID="parent-logout">
            <LogOut size={20} color={Colors.error} />
          </TouchableOpacity>
          <Text style={styles.title}>פאנל הורה</Text>
        </View>
        <Text style={styles.subtitle}>שלום, {user?.name ?? ''}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {activeKid && (
          <View style={styles.kidCard}>
            <Text style={styles.kidAvatar}>{activeKid.avatar}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.kidName}>{activeKid.name}</Text>
              <Text style={styles.kidMeta}>גיל {activeKid.age}</Text>
              <View style={styles.interestRow}>
                {interestLabels.map((it) => (
                  <View key={it.tag} style={styles.interestTag}>
                    <Text style={styles.interestText}>
                      {it.emoji} {it.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard
            icon={<Calendar size={20} color={Colors.primary} />}
            value={stats?.today ?? 0}
            label="היום"
          />
          <StatCard
            icon={<TrendingUp size={20} color={Colors.teal} />}
            value={stats?.week ?? 0}
            label="השבוע"
          />
          <StatCard
            icon={<Heart size={20} color={Colors.pink} />}
            value={stats?.total ?? 0}
            label="סה״כ"
          />
        </View>

        {stats?.topTopics && stats.topTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>נושאים מובילים</Text>
            <View style={styles.topicsBox}>
              {stats.topTopics.map(([topic, count], idx) => (
                <View key={topic} style={styles.topicRow}>
                  <Text style={styles.topicCount}>{count}</Text>
                  <Text style={styles.topicName}>
                    {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : '🥉 '}
                    {topic}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {recentParentPrompts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>נושאי שיחה עם הילד</Text>
            <Text style={styles.sectionHint}>
              דברים שכדאי לדבר עליהם בהקשר של מה שהילד שאל לאחרונה
            </Text>
            {recentParentPrompts.map((h) => (
              <View key={h.id} style={styles.promptCard}>
                <Text style={styles.promptTopic}>{h.topic}</Text>
                <Text style={styles.promptText}>{h.parentPrompt}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הגדרות</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetProfile}
            testID="reset-profile"
          >
            <RefreshCw size={18} color={Colors.error} />
            <Text style={styles.resetButtonText}>מחק פרופיל והיסטוריה</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>סקרן · גרסת MVP 0.1</Text>
          <Text style={styles.footerHint}>
            כל הנתונים נשמרים מקומית במכשיר זה. אין אנו אוספים מידע על הילד.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  scroll: { flex: 1 },
  kidCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  kidAvatar: { fontSize: 50 },
  kidName: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  kidMeta: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  interestRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  interestTag: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: { fontSize: 12, color: Colors.text, fontWeight: '600' as const },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statValue: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' as const },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'right',
  },
  sectionHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10, textAlign: 'right' },
  topicsBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  topicRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  topicName: { fontSize: 15, color: Colors.text, fontWeight: '600' as const, textAlign: 'right' },
  topicCount: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700' as const,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  promptCard: {
    backgroundColor: '#fef0f7',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  promptTopic: {
    fontSize: 12,
    color: Colors.pink,
    fontWeight: '700' as const,
    textAlign: 'right',
    marginBottom: 4,
  },
  promptText: { fontSize: 14, color: Colors.text, textAlign: 'right', lineHeight: 20 },
  resetButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    paddingVertical: 14,
    borderRadius: 14,
  },
  resetButtonText: { color: Colors.error, fontSize: 15, fontWeight: '700' as const },
  footer: { alignItems: 'center', marginTop: 14 },
  footerText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' as const },
  footerHint: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
