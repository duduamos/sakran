import { createTRPCRouter, publicProcedure } from "./create-context";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: "ok", ts: Date.now() })),
});

export type AppRouter = typeof appRouter;
