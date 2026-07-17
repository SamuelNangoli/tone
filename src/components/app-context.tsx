"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/client";
import type { VoiceProfileData } from "@/lib/voice";

export type ProfileSummary = {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  generationCount: number;
  feedbackCount: number;
  sampleCount: number;
  draftCount: number;
  data: VoiceProfileData;
};

export type WorkspaceInfo = {
  id: string;
  name: string;
  industry: string;
  accentColor: string;
};

type Density = "comfortable" | "compact";
type Theme = "light" | "dark" | "system";

type AppContextValue = {
  workspace: WorkspaceInfo;
  user: { name: string; email: string };
  role: string;
  profiles: ProfileSummary[];
  refreshProfiles: () => Promise<void>;
  activeProfileId: string | null;
  setActiveProfileId: (id: string) => void;
  density: Density;
  setDensity: (d: Density) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  focusMode: boolean;
  setFocusMode: (f: boolean) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function AppProvider({
  workspace,
  user,
  role,
  initialProfiles,
  initialPrefs,
  children,
}: {
  workspace: WorkspaceInfo;
  user: { name: string; email: string };
  role: string;
  initialProfiles: ProfileSummary[];
  initialPrefs: { theme?: Theme; density?: Density };
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(
    initialProfiles[0]?.id ?? null
  );
  const [density, setDensityState] = useState<Density>(
    initialPrefs.density ?? "comfortable"
  );
  const [theme, setThemeState] = useState<Theme>(initialPrefs.theme ?? "system");
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tone-active-profile");
    if (saved && initialProfiles.some((p) => p.id === saved)) {
      setActiveProfileIdState(saved);
    }
  }, [initialProfiles]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem("tone-active-profile", id);
  }, []);

  const refreshProfiles = useCallback(async () => {
    const data = await api<{ profiles: ProfileSummary[] }>("/api/profiles");
    setProfiles(data.profiles);
    setActiveProfileIdState((current) =>
      current && data.profiles.some((p) => p.id === current)
        ? current
        : (data.profiles[0]?.id ?? null)
    );
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    void api("/api/prefs", { method: "PATCH", body: { density: d } }).catch(() => {});
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("tone-theme", t);
    applyTheme(t);
    void api("/api/prefs", { method: "PATCH", body: { theme: t } }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider
      value={{
        workspace,
        user,
        role,
        profiles,
        refreshProfiles,
        activeProfileId,
        setActiveProfileId,
        density,
        setDensity,
        theme,
        setTheme,
        focusMode,
        setFocusMode,
      }}
    >
      <div
        data-density={density}
        className="flex min-h-dvh flex-col"
        style={{ "--brand": workspace.accentColor } as React.CSSProperties}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
}
