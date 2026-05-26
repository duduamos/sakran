import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { publicProcedure } from '../create-context';

const KidAge = z.union([
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
]);

const InterestTag = z.enum([
  'animals',
  'space',
  'dinosaurs',
  'sports',
  'art',
  'music',
  'science',
  'history',
  'cars',
  'nature',
]);

const InputSchema = z.object({
  question: z.string().min(1).max(500),
  age: KidAge,
  interests: z.array(InterestTag).max(10),
});

const OutputSchema = z.object({
  answer: z.string(),
  followUp: z.string(),
  parentPrompt: z.string(),
  topic: z.string(),
  safetyFlag: z.enum(['ok', 'redirected']),
});

export type AnswerOutput = z.infer<typeof OutputSchema>;

function styleForAge(age: number): string {
  if (age <= 6) {
    return 'מילים פשוטות מאוד, משפטים קצרים (5-8 מילים), הסבר חזותי עם השוואות לחיי היומיום של ילד בן ' + age + '.';
  }
  if (age <= 8) {
    return 'משפטים פשוטים אך מלאים, אפשר להוסיף 1-2 פרטים מעניינים, השווה לדברים שילד בן ' + age + ' מכיר.';
  }
  return 'אפשר מילים מורכבות יותר ועובדות מעמיקות, אבל עדיין ידידותי ומסקרן לילד בן ' + age + '.';
}

function buildSystemPrompt(age: number, interests: string[]): string {
  const interestsList = interests.length > 0 ? interests.join(', ') : 'דברים כלליים';
  return `אתה "סקרן", עוזר AI בעברית לילדים סקרנים בגיל ${age}.

המטרה שלך: לענות בעברית פשוטה ובטוחה על שאלות של ילדים בני 5-10, ולעורר עוד סקרנות.

הילד שאתה מדבר איתו עכשיו בן ${age} ומתעניין ב: ${interestsList}.

סגנון התשובה: ${styleForAge(age)}

חוקי בטיחות חמורים (אסור לסטות):
1. שום תוכן מפחיד, אלים, מיני, או מזיק. אם השאלה נוגעת בנושאים כאלה — החזר תשובה ניטרלית ידידותית כמו "זאת שאלה שכדאי לשאול את אמא או אבא, הם הכי טובים לזה!" וסמן safetyFlag: "redirected".
2. אין מידע רפואי, פסיכולוגי, או משפטי ספציפי. הפנה להורה.
3. אם השאלה לא ברורה — תן את התשובה הטובה ביותר שאתה יכול, אל תבקש הבהרות.
4. תמיד אופטימי וסקרני, לעולם לא ביקורתי או מבטל.
5. אין הזכרה של AI, מודלים, Claude, או טכנולוגיה — אתה פשוט "סקרן".

מבנה התשובה (חובה לקרוא לטול provide_answer):
- answer: 2-4 משפטים, כולל **עובדה מעניינת אחת** ספציפית (לא כללית).
- followUp: שאלה אחת חוזרת שתעורר חשיבה, מותאמת לגיל.
- parentPrompt: משפט אחד שמיועד להורה — מה ללמוד שאלה שהילד שאל ואיך להמשיך את השיחה.
- topic: נושא כללי בעברית במילה-שתיים (לדוגמה: "חתולים", "חלל", "גוף האדם").
- safetyFlag: "ok" אם הכל תקין, "redirected" אם הפנית להורה.`;
}

const ANSWER_TOOL: Anthropic.Tool = {
  name: 'provide_answer',
  description: 'מספק תשובה מובנית לשאלה של ילד',
  input_schema: {
    type: 'object',
    properties: {
      answer: { type: 'string', description: '2-4 משפטים בעברית, מותאם לגיל הילד' },
      followUp: { type: 'string', description: 'שאלה אחת חוזרת בעברית' },
      parentPrompt: { type: 'string', description: 'משפט אחד בעברית שמיועד להורה' },
      topic: { type: 'string', description: 'נושא כללי בעברית במילה-שתיים' },
      safetyFlag: {
        type: 'string',
        enum: ['ok', 'redirected'],
        description: '"ok" אם הכל תקין, "redirected" אם הפנית את הילד להורה',
      },
    },
    required: ['answer', 'followUp', 'parentPrompt', 'topic', 'safetyFlag'],
  },
};

export const askQuestionProcedure = publicProcedure
  .input(InputSchema)
  .mutation(async ({ input }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set on the server');
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: buildSystemPrompt(input.age, input.interests),
      tools: [ANSWER_TOOL],
      tool_choice: { type: 'tool', name: 'provide_answer' },
      messages: [{ role: 'user', content: input.question }],
    });

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );
    if (!toolBlock) {
      throw new Error('Model did not return a structured answer');
    }

    const parsed = OutputSchema.safeParse(toolBlock.input);
    if (!parsed.success) {
      console.error('[answer] schema mismatch:', parsed.error);
      throw new Error('Model returned an invalid structure');
    }

    console.log('[answer] usage:', response.usage);
    return parsed.data;
  });
