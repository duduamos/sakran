# סקרן (Sakran) — AI Assistant for Curious Kids

## Product

Hebrew-first AI assistant for children ages 5-10 that answers questions with
age-appropriate explanations + curated images, and surfaces conversation
prompts to parents. The product is **parent-managed, child-used**: a parent
creates the child profile, and the child interacts with the answers.

The previous "Field Report System" app has been completely removed from this
repo. All field-report code, types, and routes are gone.

## Sprint Status

| Sprint | Content | Status |
|---|---|---|
| **0** | Repo cleanup, screen scaffolding with mock data | ✅ Done |
| **1** | Parent registration, child profile DB | TODO |
| **2** | Claude API integration for age-tuned answers | TODO |
| **3** | Moderation layer + safety filters | TODO |
| **4** | Curated image cache (500 topics) | TODO |
| **5** | Full parent dashboard | TODO |
| **6** | User testing with real kids, App Store | TODO |

## Stack

- **App**: React Native + Expo Router 6 (file-based routing)
- **Backend**: Hono + tRPC (currently just a `/health` route)
- **State**: AsyncStorage + custom context hooks (`@nkzw/create-context-hook`)
- **Runtime**: Bun
- **UI lang**: Hebrew, RTL-first

## Key directories

```
expo/
  app/
    _layout.tsx        — root nav gate (login → onboarding → tabs)
    login.tsx          — parent login
    onboarding.tsx     — parent creates child profile (name, age, interests)
    (tabs)/
      index.tsx        — child: "ask anything" screen
      library.tsx      — past Q&A
      parent.tsx       — parent dashboard (stats, conversation prompts)
  components/
    AnswerCard.tsx     — Q/A card with image carousel + follow-up
  constants/
    colors.ts          — kid-friendly purple+pink+amber palette
    mockAnswers.ts     — Sprint-0 mock Q&A by age (5-10)
    users.ts           — default parent demo account
  contexts/
    AuthContext.tsx    — parent session
    KidContext.tsx     — active child profile + question history
  types/
    kid.ts             — KidProfile, QuestionRecord, ParentUser, INTERESTS
  backend/
    hono.ts            — Hono app
    trpc/              — tRPC router (currently `health` only)
```

## Running

```bash
cd expo
bun install
bun run start      # Expo CLI, tunneled — scan QR
bun run start-web  # web preview
```

Default demo parent login: `demo` / `1234`.

## Conventions

- **Hebrew-first**: all user-facing text in Hebrew; `flexDirection: 'row-reverse'` for RTL rows
- **No real LLM yet**: `KidContext.askQuestion` calls `makeMockRecord` which
  pattern-matches keywords against curated mock answers. Replace this in
  Sprint 2 with a tRPC call to Claude.
- **No remote DB yet**: all state is in AsyncStorage. The Turso credentials
  from the old field-report app were removed.
- **Privacy by default**: nothing leaves the device. Future LLM calls must
  send minimal context (no name, no age beyond bucket, etc.).

## Hard constraints to remember

- **COPPA/GDPR-K**: no data collection on children without verifiable
  parental consent. Parent is the legal user; child is supervised.
- **All content must be moderated** before reaching a child. When LLM
  integration lands in Sprint 2, every response passes through OpenAI
  Moderation API (or equivalent) before display.
- **No image generation in MVP**: only curated, pre-approved images. Costs
  are too high otherwise (~$24/child/month vs ~$5 for curated).

## Branch

Development branch: `claude/ai-kids-assistant-qPQSs`
