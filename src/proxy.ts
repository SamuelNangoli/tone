import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

// Refreshes the Supabase auth cookie on every request so Server Components
// always see a valid session. Next.js 16 renamed Middleware to Proxy —
// same file convention, exported name changed from `middleware` to `proxy`.
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  // If Supabase isn't configured, skip auth entirely — otherwise a paused or
  // unreachable project would make every request fail with a network error.
  if (!env.configured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url!, env.anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() is what triggers the token refresh + cookie rewrite.
  // A network failure here (project paused/offline) must not take down the
  // whole app — swallow it and let the request through as signed-out.
  try {
    await supabase.auth.getUser();
  } catch {
    // ignore — proceed without a refreshed session
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
