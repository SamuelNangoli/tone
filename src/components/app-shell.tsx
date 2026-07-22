"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  PenLine,
  FileText,
  Fingerprint,
  Settings,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Focus,
  Rows3,
  Rows4,
  Menu,
  LogOut,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { AccuracyRing } from "@/components/accuracy-ring";
import { ToneMark } from "@/components/tone-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/client";

const NAV = [
  { href: "/app", label: "Write", icon: PenLine },
  { href: "/app/drafts", label: "Drafts", icon: FileText },
  { href: "/app/profiles", label: "Voice profiles", icon: Fingerprint },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, user, profiles, activeProfileId, setActiveProfileId } = useApp();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <ToneMark size={26} className="shrink-0 text-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="truncate text-xs text-muted-foreground">{workspace.industry}</p>
        </div>
      </div>

      <nav className="grid gap-1 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                active ? "font-medium" : "text-muted-foreground hover:bg-muted"
              }`}
              style={active ? { background: "var(--brand-soft)", color: "var(--brand)" } : undefined}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex-1 overflow-y-auto px-2">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Voice profiles
        </p>
        <div className="grid gap-1">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProfileId(p.id);
                onNavigate?.();
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                p.id === activeProfileId ? "bg-muted font-medium" : "text-muted-foreground"
              }`}
            >
              <AccuracyRing value={p.accuracy} size={28} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.id === activeProfileId && (
                <span className="size-1.5 rounded-full" style={{ background: "var(--brand)" }} />
              )}
            </button>
          ))}
          {profiles.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No profiles yet — create one to start writing in your voice.
            </p>
          )}
        </div>
        <Link
          href="/app/profiles"
          onClick={onNavigate}
          className="mt-1 block px-3 py-2 text-xs underline-offset-2 hover:underline"
          style={{ color: "var(--brand)" }}
        >
          + New voice profile
        </Link>
      </div>

      <div className="border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Sign out"
            onClick={async () => {
              await api("/api/auth/logout", { method: "POST", body: {} });
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { density, setDensity, theme, setTheme, focusMode, setFocusMode } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideSidebar = collapsed || focusMode;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-dvh w-full">
        {/* Left pane — desktop */}
        {!hideSidebar && (
          <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">
            <div className="sticky top-0 h-dvh">
              <SidebarContent />
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex items-center gap-1 border-b bg-background/90 px-3 py-2 backdrop-blur">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="lg:hidden" />}
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop collapse */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:inline-flex"
                    onClick={() => setCollapsed((c) => !c)}
                  />
                }
              >
                {hideSidebar ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </TooltipTrigger>
              <TooltipContent>Toggle sidebar</TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={focusMode ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setFocusMode(!focusMode)}
                  />
                }
              >
                <Focus className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Focus mode — hide side panels</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
                  />
                }
              >
                {density === "compact" ? <Rows4 className="size-4" /> : <Rows3 className="size-4" />}
              </TooltipTrigger>
              <TooltipContent>Density: {density}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  />
                }
              >
                {mounted ? (
                  <>
                    <Sun className="size-4 dark:hidden" />
                    <Moon className="hidden size-4 dark:block" />
                  </>
                ) : (
                  // Render a placeholder to match server output
                  <div className="size-4" />
                )}
              </TooltipTrigger>
              <TooltipContent>Toggle light/dark</TooltipContent>
            </Tooltip>
          </header>

          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
