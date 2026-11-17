import { env } from "@/server/env";
import { Judge0Judge } from "./judge0";
import type { Judge } from "./types";

/**
 * Returns the configured judge, or null when no judge is configured.
 * There is deliberately NO fallback that runs code inside this process: without Judge0 the practice pages
 * still work, but Run/Submit report "judge unavailable" and nothing is ever marked Accepted.
 */
export function getJudge(): Judge | null {
  const e = env();
  if (!e.JUDGE0_URL) return null;
  return new Judge0Judge({
    baseUrl: e.JUDGE0_URL,
    authToken: e.JUDGE0_AUTH_TOKEN,
    rapidApiKey: e.JUDGE0_RAPIDAPI_KEY,
    rapidApiHost: e.JUDGE0_RAPIDAPI_HOST,
    languageIds: { cpp17: e.JUDGE0_CPP17_ID, cpp20: e.JUDGE0_CPP20_ID },
  });
}
