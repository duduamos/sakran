export type KidAge = 5 | 6 | 7 | 8 | 9 | 10;

export type InterestTag =
  | 'animals'
  | 'space'
  | 'dinosaurs'
  | 'sports'
  | 'art'
  | 'music'
  | 'science'
  | 'history'
  | 'cars'
  | 'nature';

export interface KidProfile {
  id: string;
  name: string;
  age: KidAge;
  interests: InterestTag[];
  avatar: string;
  createdAt: string;
}

export interface ParentUser {
  username: string;
  name: string;
  email?: string;
}

export interface QuestionImage {
  url?: string;
  caption?: string;
  emoji?: string;
  bg?: string;
  source: 'curated' | 'generated' | 'mock';
}

export interface QuestionRecord {
  id: string;
  kidId: string;
  question: string;
  answer: string;
  images: QuestionImage[];
  followUp?: string;
  parentPrompt?: string;
  topic: string;
  createdAt: string;
}

export interface InterestMeta {
  tag: InterestTag;
  label: string;
  emoji: string;
}

export const INTERESTS: InterestMeta[] = [
  { tag: 'animals', label: 'בעלי חיים', emoji: '🦁' },
  { tag: 'space', label: 'חלל', emoji: '🚀' },
  { tag: 'dinosaurs', label: 'דינוזאורים', emoji: '🦖' },
  { tag: 'sports', label: 'ספורט', emoji: '⚽' },
  { tag: 'art', label: 'אומנות', emoji: '🎨' },
  { tag: 'music', label: 'מוזיקה', emoji: '🎵' },
  { tag: 'science', label: 'מדע', emoji: '🔬' },
  { tag: 'history', label: 'היסטוריה', emoji: '🏛️' },
  { tag: 'cars', label: 'רכבים', emoji: '🚗' },
  { tag: 'nature', label: 'טבע', emoji: '🌳' },
];
