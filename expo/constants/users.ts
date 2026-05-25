import { ParentUser } from '@/types/kid';

interface DefaultParent extends ParentUser {
  password: string;
}

export const DEFAULT_PARENTS: DefaultParent[] = [
  { username: 'demo', password: '1234', name: 'הורה דמו', email: 'demo@example.com' },
];
