// Central check for whether Supabase is actually configured.
//
// A real Supabase anon/service key is a JWT (~200+ chars). Placeholder or
// half-pasted values are much shorter, so we gate on length as well as
// presence. When Supabase isn't configured, the app degrades gracefully:
// public pages still render, and auth actions return a clear "add your keys"
// message instead of throwing an opaque network error on every request.

const looksLikeKey = (v?: string) => Boolean(v && v.length > 100);

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    url,
    anonKey,
    serviceKey,
    /** Enough to run auth for end users (login/signup/session). */
    configured: Boolean(url) && looksLikeKey(anonKey),
    /** Enough to run admin actions (invites, seeding). */
    adminConfigured: Boolean(url) && looksLikeKey(serviceKey),
  };
}

export const SUPABASE_SETUP_MESSAGE =
  "Authentication isn't configured yet. Add your Supabase project URL and keys to .env (see README → Supabase setup), then restart the dev server.";
