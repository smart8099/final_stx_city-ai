"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Macro } from "./types";

interface MacroStore {
  macros: Macro[];
  addMacro: (macro: Macro) => void;
  removeMacro: (id: string) => void;
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
}

const MacroContext = createContext<MacroStore | null>(null);

function getStorageKey(tenant: string) {
  return `cityassist_macros_${tenant}`;
}

export function MacroProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;
    const key = getStorageKey(tenantSlug);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setMacros(JSON.parse(stored));
      } catch {
        setMacros([]);
      }
    } else {
      setMacros([]);
    }
    setLoaded(true);
  }, [tenantSlug]);

  useEffect(() => {
    if (loaded && tenantSlug) {
      const key = getStorageKey(tenantSlug);
      localStorage.setItem(key, JSON.stringify(macros));
    }
  }, [macros, loaded, tenantSlug]);

  const addMacro = useCallback((macro: Macro) => {
    setMacros((prev) => [...prev, macro]);
  }, []);

  const removeMacro = useCallback((id: string) => {
    setMacros((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <MacroContext.Provider value={{ macros, addMacro, removeMacro, tenantSlug, setTenantSlug }}>
      {children}
    </MacroContext.Provider>
  );
}

export function useMacros() {
  const ctx = useContext(MacroContext);
  if (!ctx) throw new Error("useMacros must be used within MacroProvider");
  return ctx;
}
