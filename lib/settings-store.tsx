"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface WidgetSettings {
  cityName: string;
  primaryColor: string;
  welcomeMessage: string;
  logoUrl: string;
  position: string;
  autoOpen: boolean;
  showDepartmentBadge: boolean;
  maxHeight: string;
}

const DEFAULT_SETTINGS: WidgetSettings = {
  cityName: "",
  primaryColor: "#1a56db",
  welcomeMessage: "",
  logoUrl: "",
  position: "bottom-right",
  autoOpen: false,
  showDepartmentBadge: true,
  maxHeight: "520",
};

interface SettingsStore {
  settings: WidgetSettings;
  updateSettings: (updates: Partial<WidgetSettings>) => void;
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
}

const SettingsContext = createContext<SettingsStore | null>(null);

function getStorageKey(tenant: string) {
  return `cityassist_settings_${tenant}`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;
    const key = getStorageKey(tenantSlug);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    setLoaded(true);
  }, [tenantSlug]);

  useEffect(() => {
    if (loaded && tenantSlug) {
      const key = getStorageKey(tenantSlug);
      localStorage.setItem(key, JSON.stringify(settings));
    }
  }, [settings, loaded, tenantSlug]);

  const updateSettings = useCallback((updates: Partial<WidgetSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, tenantSlug, setTenantSlug }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
