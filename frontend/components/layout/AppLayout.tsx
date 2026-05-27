"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, setCurrentUser } = useERStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load saved profile data if available
    try {
      const savedProfile = localStorage.getItem("settings_profile");
      if (savedProfile) {
        setCurrentUser(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.warn("Failed to load profile from localStorage:", e);
    }
    
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, setCurrentUser]);

  if (!mounted || !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
