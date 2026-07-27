"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminExperience = "admin" | "demo";

const STORAGE_KEY = "techfeed:admin-experience:v1";
const CHANGE_EVENT = "techfeed:admin-experience-change";

export const readAdminExperience = (): AdminExperience | null => {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  return value === "admin" || value === "demo" ? value : null;
};

export const writeAdminExperience = (mode: AdminExperience | null) => {
  if (typeof window === "undefined") return;
  if (mode) {
    window.sessionStorage.setItem(STORAGE_KEY, mode);
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useAdminExperience = () => {
  const [mode, setMode] = useState<AdminExperience | null>(null);

  useEffect(() => {
    const sync = () => setMode(readAdminExperience());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const updateMode = useCallback((nextMode: AdminExperience | null) => {
    writeAdminExperience(nextMode);
  }, []);

  return { mode, setMode: updateMode };
};
