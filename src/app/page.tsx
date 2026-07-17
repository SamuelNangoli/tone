import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  if (await getUserId()) redirect("/app");

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span
            className="inline-block size-3 rounded-full"
            style={{ background: "var(--brand)" }}
          />
          Tone
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false}
            render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button
            style={{ background: "var(--brand)", color: "white" }}
            nativeButton={false}
            render={<Link href="/signup" />}
          >
            Start free
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <p
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          For marketing teams that hate sounding like AI
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn your voice once.
          <br />
          <span style={{ color: "var(--brand)" }}>Sound like yourself</span>{" "}
          everywhere.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Generic AI tools forget your brand every session. Tone builds a
          persistent voice profile from your own writing — then every blog
          post, LinkedIn post, and email comes out sounding like you wrote it.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            size="lg"
            style={{ background: "var(--brand)", color: "white" }}
            nativeButton={false}
            render={<Link href="/signup" />}
          >
            Teach it your voice — 5 minutes
          </Button>
          <Button size="lg" variant="outline" nativeButton={false}
            render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            title: "Trained on you, not the internet",
            body: "Paste 3–5 pieces you're proud of, answer a short quiz, and Tone builds a structured Voice Profile you can inspect and tweak anytime.",
          },
          {
            title: "Never re-explain your brand",
            body: "Every draft is conditioned on your active profile — tone sliders, do/don't words, audience, and the competitors you refuse to sound like.",
          },
          {
            title: "Gets sharper every week",
            body: 'Thumbs up, thumbs down, and "make it more like this" edits feed back into the profile. Watch your Voice Accuracy climb.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
