import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { MessageCircle, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { QuestionRecord, QuestionImage } from '@/types/kid';

interface Props {
  record: QuestionRecord;
  compact?: boolean;
}

function ImageTile({ img }: { img: QuestionImage }) {
  const [failed, setFailed] = useState<boolean>(false);
  const showFallback = !img.url || failed;
  return (
    <View style={styles.imageWrapper}>
      {showFallback ? (
        <View style={[styles.imageFallback, { backgroundColor: img.bg ?? Colors.primaryLight }]}>
          <Text style={styles.imageFallbackEmoji}>{img.emoji ?? '🖼️'}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: img.url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
      {img.caption ? <Text style={styles.imageCaption}>{img.caption}</Text> : null}
    </View>
  );
}

export function AnswerCard({ record, compact = false }: Props) {
  return (
    <View style={styles.card} testID={`answer-card-${record.id}`}>
      <View style={styles.questionRow}>
        <Text style={styles.questionLabel}>השאלה שלך</Text>
        <Text style={styles.question}>{record.question}</Text>
      </View>

      <View style={styles.answerBlock}>
        <Text style={styles.answer}>{record.answer}</Text>
      </View>

      {record.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesRow}
          contentContainerStyle={styles.imagesContent}
        >
          {record.images.map((img, idx) => (
            <ImageTile key={idx} img={img} />
          ))}
        </ScrollView>
      )}

      {!compact && record.followUp && (
        <View style={styles.followUpBox}>
          <View style={styles.followUpHeader}>
            <MessageCircle size={16} color={Colors.primary} />
            <Text style={styles.followUpLabel}>שאלת המשך</Text>
          </View>
          <Text style={styles.followUpText}>{record.followUp}</Text>
        </View>
      )}

      {!compact && record.parentPrompt && (
        <View style={styles.parentBox}>
          <View style={styles.followUpHeader}>
            <Heart size={16} color={Colors.pink} />
            <Text style={[styles.followUpLabel, { color: Colors.pink }]}>ספר/י להורים</Text>
          </View>
          <Text style={styles.followUpText}>{record.parentPrompt}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  questionRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600' as const,
    marginBottom: 4,
    textAlign: 'right',
  },
  question: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
  },
  answerBlock: { marginBottom: 14 },
  answer: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  imagesRow: { marginBottom: 14 },
  imagesContent: { gap: 10, paddingVertical: 4 },
  imageWrapper: { width: 180 },
  image: {
    width: 180,
    height: 130,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  imageFallback: {
    width: 180,
    height: 130,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackEmoji: {
    fontSize: 60,
  },
  imageCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  followUpBox: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  parentBox: {
    backgroundColor: '#fef0f7',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  followUpHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  followUpLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  followUpText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'right',
  },
});
