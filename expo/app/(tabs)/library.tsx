import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useKid } from '@/contexts/KidContext';
import { AnswerCard } from '@/components/AnswerCard';
import { QuestionRecord } from '@/types/kid';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { history, activeKid, deleteRecord } = useKid();

  const handleDelete = (record: QuestionRecord) => {
    Alert.alert(
      'מחיקה',
      'למחוק את השאלה הזאת מהספרייה?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => deleteRecord(record.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: QuestionRecord }) => (
    <View>
      <AnswerCard record={item} compact />
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        testID={`delete-${item.id}`}
      >
        <Trash2 size={14} color={Colors.error} />
        <Text style={styles.deleteText}>מחק</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>מה למדתי</Text>
        <Text style={styles.subtitle}>
          {history.length > 0
            ? `${history.length} שאלות בספרייה של ${activeKid?.name ?? ''}`
            : 'עוד אין שאלות בספרייה'}
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <BookOpen size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>הספרייה ריקה</Text>
          <Text style={styles.emptyHint}>שאל שאלות בטאב הראשי כדי לבנות את הספרייה</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: { fontSize: 26, fontWeight: '800' as const, color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '700' as const, color: Colors.textSecondary, marginTop: 16 },
  emptyHint: { fontSize: 14, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
  deleteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -12,
    marginBottom: 16,
  },
  deleteText: { fontSize: 12, color: Colors.error, fontWeight: '600' as const },
});
