import { createTRPCRouter, publicProcedure } from "./create-context";
import { askQuestionProcedure } from "./routes/answer";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: "ok", ts: Date.now() })),
  ask: askQuestionProcedure,
});

export type AppRouter = typeof appRouter;
