"use client";

import { useEffect } from "react";
import { useERStore } from "@/lib/store";

export function SyncWrapper({ children }: { children: React.ReactNode }) {
  const { syncWithBackend, setupSocket, isLoggedIn } = useERStore();

  useEffect(() => {
    if (!isLoggedIn) return;

    syncWithBackend();
    const cleanupSocket = setupSocket();
    
    const interval = setInterval(syncWithBackend, 10000); // 10s interval for backup sync
    
    return () => {
      clearInterval(interval);
      if (typeof cleanupSocket === "function") {
        cleanupSocket();
      }
    };
  }, [syncWithBackend, setupSocket, isLoggedIn]);

  return <>{children}</>;
}
