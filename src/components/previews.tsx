"use client";

// Format-appropriate previews: a tweet looks like a tweet, an email like an
// email. The canvas adapts to the selected content type instead of being one
// generic textbox.

import type { ContentType } from "@/lib/voice";

function BrandAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: "var(--brand)" }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function handleize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function TweetPreview({ content, brand }: { content: string; brand: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-4">
      <div className="flex gap-3">
        <BrandAvatar name={brand} />
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-bold">{brand}</span>{" "}
            <span className="text-muted-foreground">@{handleize(brand)} · now</span>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug">{content}</p>
          <div className="mt-3 flex max-w-xs justify-between text-xs text-muted-foreground">
            <span>💬 12</span>
            <span>🔁 34</span>
            <span>❤️ 208</span>
            <span>📊 12K</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground">
        {content.length}/280
      </p>
    </div>
  );
}

export function LinkedInPreview({ content, brand }: { content: string; brand: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border bg-card">
      <div className="flex items-center gap-3 p-4 pb-2">
        <BrandAvatar name={brand} />
        <div>
          <p className="text-sm font-semibold">{brand}</p>
          <p className="text-xs text-muted-foreground">2,481 followers · 1h · 🌐</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed">{content}</p>
      <div className="flex justify-around border-t px-4 py-2 text-xs text-muted-foreground">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>➤ Send</span>
      </div>
    </div>
  );
}

export function EmailPreview({ content, brand }: { content: string; brand: string }) {
  const lines = content.split("\n");
  const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, "") : "(no subject)";
  const body = lines
    .filter((l) => l !== subjectLine)
    .join("\n")
    .replace(/^\n+/, "");
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/50 px-4 py-3">
        <p className="text-sm font-semibold">{subject}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {brand} &lt;hello@{handleize(brand)}.com&gt; — to you
        </p>
      </div>
      <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export function BlogPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const title = lines[0] ?? "";
  const rest = lines.slice(1);
  return (
    <article className="preview-prose mx-auto max-w-2xl rounded-lg border bg-card px-6 py-6">
      <h1>{title}</h1>
      {rest.map((line, i) =>
        line.startsWith("## ") ? (
          <h2 key={i}>{line.slice(3)}</h2>
        ) : line.trim() ? (
          <p key={i}>{line}</p>
        ) : null
      )}
    </article>
  );
}

export function LandingPreview({ content }: { content: string }) {
  const sections: { name: string; lines: string[] }[] = [];
  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      sections.push({ name: line.slice(3), lines: [] });
    } else if (line.trim() && sections.length) {
      sections[sections.length - 1].lines.push(line);
    }
  }
  return (
    <div className="mx-auto grid max-w-2xl gap-3">
      {sections.map((s, i) => (
        <div
          key={i}
          className={`rounded-lg border bg-card p-5 ${i === 0 ? "text-center" : ""}`}
        >
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--brand)" }}
          >
            {s.name}
          </p>
          {s.lines.map((l, j) => (
            <p
              key={j}
              className={
                i === 0 && j === 0
                  ? "text-2xl font-bold tracking-tight"
                  : i === 0 && j === 1
                    ? "mt-2 text-muted-foreground"
                    : "text-sm leading-relaxed"
              }
            >
              {l}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormatPreview({
  contentType,
  content,
  brand,
}: {
  contentType: ContentType;
  content: string;
  brand: string;
}) {
  if (!content.trim())
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    );
  switch (contentType) {
    case "tweet":
      return <TweetPreview content={content} brand={brand} />;
    case "linkedin":
      return <LinkedInPreview content={content} brand={brand} />;
    case "email":
      return <EmailPreview content={content} brand={brand} />;
    case "landing":
      return <LandingPreview content={content} />;
    case "blog":
    default:
      return <BlogPreview content={content} />;
  }
}
