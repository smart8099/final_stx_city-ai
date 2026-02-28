"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DepartmentConfig } from "./types";

interface DepartmentStore {
  departments: DepartmentConfig[];
  addDepartment: (dept: DepartmentConfig) => void;
  removeDepartment: (id: string) => void;
  updateDepartment: (id: string, updates: Partial<DepartmentConfig>) => void;
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
}

const DepartmentContext = createContext<DepartmentStore | null>(null);

function getStorageKey(tenant: string) {
  return `cityassist_departments_${tenant}`;
}

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;
    const key = getStorageKey(tenantSlug);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate: ensure members array exists and has firstName/lastName
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const migrated = parsed.map((d: any) => ({
          ...d,
          members: (d.members || []).map((m: any) => ({
            id: m.id || `member-${Date.now()}`,
            firstName: m.firstName || (m.name ? m.name.split(" ")[0] : ""),
            lastName: m.lastName || (m.name ? m.name.split(" ").slice(1).join(" ") : ""),
            email: m.email || "",
          })),
        }));
        setDepartments(migrated);
      } catch {
        setDepartments([]);
      }
    } else {
      setDepartments([]);
    }
    setLoaded(true);
  }, [tenantSlug]);

  useEffect(() => {
    if (loaded && tenantSlug) {
      const key = getStorageKey(tenantSlug);
      localStorage.setItem(key, JSON.stringify(departments));
    }
  }, [departments, loaded, tenantSlug]);

  const addDepartment = useCallback((dept: DepartmentConfig) => {
    setDepartments((prev) => [...prev, dept]);
  }, []);

  const removeDepartment = useCallback((id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDepartment = useCallback((id: string, updates: Partial<DepartmentConfig>) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  return (
    <DepartmentContext.Provider
      value={{ departments, addDepartment, removeDepartment, updateDepartment, tenantSlug, setTenantSlug }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartments() {
  const ctx = useContext(DepartmentContext);
  if (!ctx) throw new Error("useDepartments must be used within DepartmentProvider");
  return ctx;
}
