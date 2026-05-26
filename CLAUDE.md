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
| **1** | Parent registration (Supabase Auth) + child profile DB (Supabase Postgres) | ✅ Done |
| **2** | Claude API integration for age-tuned answers | ✅ Done |
| **3** | Moderation layer + safety filters | TODO |
| **4** | Curated image cache (500 topics) | TODO |
| **5** | Full parent dashboard | TODO |
| **6** | User testing with real kids, App Store | TODO |

## Stack

- **App**: React Native + Expo Router 6 (file-based routing)
- **Backend**: Hono + tRPC mounted at `/api/trpc/*`, served by an Expo
  Router API route (`app/api/trpc/[...trpc]+api.ts`) — runs in the same
  Expo dev server, no second process.
- **Auth + DB**: Supabase (Postgres + Auth, RLS-protected)
- **Local state**: AsyncStorage + custom context hooks (`@nkzw/create-context-hook`)
- **Runtime**: Bun
- **UI lang**: Hebrew, RTL-first

## Key directories

```
expo/
  app/
    _layout.tsx        — root nav gate (auth → onboarding → tabs)
    login.tsx          — parent sign-in (email + password)
    signup.tsx         — parent sign-up + age/terms attestation
    onboarding.tsx     — parent creates child profile (name, age, interests)
    (tabs)/
      index.tsx        — child: "ask anything" screen
      library.tsx      — past Q&A
      parent.tsx       — parent dashboard (stats, conversation prompts)
    api/
      trpc/
        [...trpc]+api.ts — Expo Router API route that hands every
                           request under /api/trpc/* to the Hono app
  components/
    AnswerCard.tsx     — Q/A card with image carousel + follow-up
  constants/
    colors.ts          — kid-friendly purple+pink+amber palette
    mockAnswers.ts     — Sprint-0 mock Q&A by age (5-10)
  contexts/
    AuthContext.tsx    — Supabase parent session (signUp/signIn/signOut)
    KidContext.tsx     — kids list (Supabase) + history (AsyncStorage per parent)
  lib/
    supabase.ts        — Supabase client (AsyncStorage adapter, env-driven)
  types/
    kid.ts             — KidProfile, QuestionRecord, ParentUser, INTERESTS
  backend/
    hono.ts            — Hono app, mounted by the API route above;
                         exposes /api (health) + /api/trpc/* (tRPC)
    trpc/
      app-router.ts    — tRPC router (health + ask)
      routes/
        answer.ts      — Claude Haiku 4.5 call with age-tuned Hebrew prompt
supabase/
  migrations/
    0001_init.sql      — parent_profiles, kids, RLS, signup trigger
```

## Running

```bash
cd expo
cp .env.example .env       # then fill in Supabase URL + anon key + Anthropic key
bun install
bun run start      # bunx expo start --tunnel, scan QR
bun run start-web  # web preview
```

The Hono + tRPC backend is served by the Expo Router API route at
`app/api/trpc/[...trpc]+api.ts`, so there is no separate backend process:
the same `expo start` dev server handles the app *and* `/api/trpc/*`.

### Supabase setup (one-time)

1. Create a project at https://supabase.com (Frankfurt or London region).
2. **Authentication → Providers**: keep Email enabled with "Confirm email" on.
3. Open the SQL Editor and run `supabase/migrations/0001_init.sql`.
4. Copy **Project URL** + **anon public key** into `expo/.env`.

No demo account — sign up as a real parent via the in-app signup screen.

## Conventions

- **Hebrew-first**: all user-facing text in Hebrew; `flexDirection: 'row-reverse'` for RTL rows
- **LLM**: `KidContext.askQuestion` calls the backend `ask` tRPC route, which
  hits Claude Haiku 4.5 with an age-tuned Hebrew system prompt and a forced
  `provide_answer` tool for structured output. Falls back to `makeMockRecord`
  if `ANTHROPIC_API_KEY` is missing or the call fails.
- **Remote DB**: parent + kids live in Supabase Postgres, behind RLS so
  each parent only ever sees their own rows. Question history is still
  AsyncStorage-only (per parent id), pending Sprint 2.
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

Development branch: `claude/affectionate-johnson-VumSc`
