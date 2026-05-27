"use client";
import { Bell, Clock, RefreshCw, CheckCircle2, AlertCircle, Undo } from "lucide-react";
import Link from "next/link";
import { useERStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { alerts, syncStatus, lastSynced, currentUser, undoAction } = useERStore();
  const unread = alerts.filter((a) => !a.read).length;
  const [time, setTime] = useState("");

  const handleUndo = async () => {
    try {
      const result = await undoAction();
      if (result?.restored_action) {
        // Optional: you could add a toast here. For now, it silently succeeds.
      }
    } catch (e: any) {
      alert(e.message || "Failed to undo");
    }
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-border">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-foreground leading-none">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">{currentUser.role}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/50 text-[10px] font-medium text-muted-foreground">
            {syncStatus === "syncing" && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
            {syncStatus === "synced" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            {syncStatus === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
            <span className="uppercase tracking-tight">
              {syncStatus === "syncing" ? "Syncing..." : `Synced ${lastSynced || "N/A"}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-1 rounded border border-border/50">
            <Clock className="w-3.5 h-3.5" />
            {time}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <button onClick={handleUndo} title="Undo Last Action" className="relative p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border border-border">
            <Undo className="w-4.5 h-4.5" />
          </button>
          <ThemeToggle />
          <Link href="/alerts" className="relative p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border border-border">
            <Bell className="w-4.5 h-4.5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold border-2 border-card">
                {unread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
