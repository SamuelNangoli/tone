"use client";

// Shows a clear setup notice on auth pages when Supabase credentials are
// missing or look like placeholders, so a paused/unconfigured project reads
// as "finish setup" rather than a mysterious error. Only NEXT_PUBLIC_* vars
// are available on the client, which is exactly what login/signup need.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(url) && Boolean(anon && anon.length > 100);

export function SetupBanner() {
  if (configured) return null;
  return (
    <div className="w-full max-w-sm rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
      <p className="font-medium">Finish Supabase setup to sign in</p>
      <p className="mt-1 text-amber-700/80 dark:text-amber-300/80">
        Add your project URL and keys to <code>.env</code> (Supabase dashboard →
        Project Settings → API), then restart the dev server. See the README.
      </p>
    </div>
  );
}
