import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";

const getBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    console.warn('[API] EXPO_PUBLIC_RORK_API_BASE_URL is not set');
    return '';
  }
  return url;
};

let vanillaClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export function getClient() {
  const base = getBaseUrl();
  if (!base) {
    throw new Error('Backend URL not configured');
  }

  if (!vanillaClient) {
    vanillaClient = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: `${base}/api/trpc`,
          transformer: superjson,
        }),
      ],
    });
  }

  return vanillaClient;
}

export function isBackendConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
}
