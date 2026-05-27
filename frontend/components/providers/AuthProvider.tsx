"use client";

import { useEffect, ReactNode } from "react";
import { useERStore } from "@/lib/store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLoggedIn } = useERStore();

  useEffect(() => {
    // Disabled Firebase auth listener to use the demo login only
  }, [setLoggedIn]);

  return <>{children}</>;
}
