"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useApp } from "@/components/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Member = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

const ACCENTS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function SettingsPage() {
  const router = useRouter();
  const { workspace, role, theme, setTheme, density, setDensity } = useApp();
  const isOwner = role === "owner";

  const [name, setName] = useState(workspace.name);
  const [industry, setIndustry] = useState(workspace.industry);
  const [accent, setAccent] = useState(workspace.accentColor);
  const [members, setMembers] = useState<Member[]>([]);
  const [invite, setInvite] = useState({ name: "", email: "", role: "editor" });

  useEffect(() => {
    api<{ members: Member[] }>("/api/members").then((d) => setMembers(d.members));
  }, []);

  async function saveWorkspace() {
    try {
      await api("/api/workspace", {
        method: "PATCH",
        body: { name, industry, accentColor: accent },
      });
      toast.success("Workspace updated.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function sendInvite() {
    try {
      const res = await api<{ tempPassword: string | null }>("/api/members", {
        body: invite,
      });
      const d = await api<{ members: Member[] }>("/api/members");
      setMembers(d.members);
      setInvite({ name: "", email: "", role: "editor" });
      toast.success(
        res.tempPassword
          ? `Invited! Temporary password: ${res.tempPassword} (share it securely — shown once)`
          : "Added existing user to the workspace.",
        { duration: 15000 }
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function updateMember(membershipId: string, patch: { role?: string; remove?: boolean }) {
    try {
      await api("/api/members", { method: "PATCH", body: { membershipId, ...patch } });
      const d = await api<{ members: Member[] }>("/api/members");
      setMembers(d.members);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="pane-pad mx-auto grid w-full max-w-3xl gap-6">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Personal — saved to your account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="grid gap-1.5">
            <Label>Theme</Label>
            <Select
              value={theme}
              items={{ light: "Light", dark: "Dark", system: "System" }}
              onValueChange={(v) => v && setTheme(v as never)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Density</Label>
            <Select
              value={density}
              items={{ comfortable: "Comfortable", compact: "Compact" }}
              onValueChange={(v) => v && setDensity(v as never)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>
            {isOwner ? "Brand-level settings for everyone." : "Only the owner can edit these."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Company name</Label>
            <Input value={name} disabled={!isOwner} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Industry / niche</Label>
            <Input value={industry} disabled={!isOwner} onChange={(e) => setIndustry(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              This single value tailors the whole product — swap it to serve any vertical.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Accent color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  disabled={!isOwner}
                  onClick={() => setAccent(c)}
                  className={`size-7 rounded-full border-2 ${accent === c ? "border-foreground" : "border-transparent"}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
              <Input
                className="w-28"
                value={accent}
                disabled={!isOwner}
                onChange={(e) => setAccent(e.target.value)}
              />
            </div>
          </div>
          {isOwner && (
            <Button onClick={() => void saveWorkspace()} className="justify-self-start" style={{ background: "var(--brand)", color: "white" }}>
              Save workspace
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
          <CardDescription>Owner can edit everything, editors write, viewers read.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            {members.map((m) => (
              <div key={m.membershipId} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                {isOwner && m.role !== "owner" ? (
                  <>
                    <Select
                      value={m.role}
                      items={{ editor: "Editor", viewer: "Viewer" }}
                      onValueChange={(v) => v && void updateMember(m.membershipId, { role: v })}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void updateMember(m.membershipId, { remove: true })}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary">{m.role}</Badge>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                placeholder="Name"
                value={invite.name}
                onChange={(e) => setInvite((i) => ({ ...i, name: e.target.value }))}
              />
              <Input
                placeholder="email@company.com"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
              />
              <Select
                value={invite.role}
                items={{ editor: "Editor", viewer: "Viewer" }}
                onValueChange={(v) => v && setInvite((i) => ({ ...i, role: v }))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => void sendInvite()} disabled={!invite.name || !invite.email}>
                Invite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
