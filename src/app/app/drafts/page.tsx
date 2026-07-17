"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useApp } from "@/components/app-context";
import { CONTENT_TYPES, type ContentType } from "@/lib/voice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DraftRow = {
  id: string;
  title: string;
  contentType: ContentType;
  status: string;
  profileId: string;
  profileName: string;
  author: string | null;
  updatedAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  published: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function DraftsPage() {
  const { role, profiles } = useApp();
  const canEdit = role === "owner" || role === "editor";
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [profileFilter, setProfileFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api<{ drafts: DraftRow[] }>("/api/drafts")
      .then((d) => setDrafts(d.drafts))
      .finally(() => setLoaded(true));
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/drafts/${id}`, { method: "PATCH", body: { status } });
      setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/drafts/${id}`, { method: "DELETE" });
      setDrafts((ds) => ds.filter((d) => d.id !== id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const visible = drafts.filter(
    (d) =>
      (profileFilter === "all" || d.profileId === profileFilter) &&
      (statusFilter === "all" || d.status === statusFilter)
  );

  return (
    <div className="pane-pad mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Drafts</h1>
        <div className="flex-1" />
        <Select
          value={profileFilter}
          items={{ all: "All profiles", ...Object.fromEntries(profiles.map((p) => [p.id, p.name])) }}
          onValueChange={(v) => v && setProfileFilter(v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All profiles</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          items={{ all: "All statuses", draft: "Draft", approved: "Approved", published: "Published" }}
          onValueChange={(v) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loaded && visible.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate something in the workspace and hit Save — drafts keep your
            voice profile and brief attached.
          </p>
          <Button className="mt-4" variant="outline" nativeButton={false}
            render={<Link href="/app" />}>
            Go write
          </Button>
        </div>
      )}

      <div className="grid gap-2">
        {visible.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <Link href={`/app?draft=${d.id}`} className="font-medium hover:underline">
                {d.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {CONTENT_TYPES.find((t) => t.id === d.contentType)?.label} ·{" "}
                {d.profileName}
                {d.author ? ` · ${d.author}` : ""} ·{" "}
                {new Date(d.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge className={STATUS_STYLES[d.status] ?? ""} variant="secondary">
              {d.status}
            </Badge>
            {canEdit && (
              <>
                <Select
                  value={d.status}
                  items={{ draft: "Draft", approved: "Approved", published: "Published" }}
                  onValueChange={(v) => v && void setStatus(d.id, v)}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => void remove(d.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
