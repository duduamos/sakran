import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";
import type { AppRouter } from "@/backend/trpc/app-router";

function getBaseUrl(): string {
  // Explicit override always wins (useful for production deploys)
  const override = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (override) return override.replace(/\/$/, "");

  // Web: same origin, use a relative URL
  if (Platform.OS === "web") return "";

  // Native (dev): derive host from the Expo dev server
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest?.debuggerHost ??
    "";
  const host = hostUri.split(":")[0];
  if (!host) {
    console.warn("[API] Could not resolve dev host; set EXPO_PUBLIC_API_BASE_URL");
    return "";
  }
  return `http://${host}:8081`;
}

let vanillaClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export function getClient() {
  if (!vanillaClient) {
    vanillaClient = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    });
  }
  return vanillaClient;
}

// Backend is always reachable now (same origin on web, dev host on native).
// Keep the helper so callers don't have to change, but it's effectively a const.
export function isBackendConfigured(): boolean {
  return true;
}
