"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useERStore } from "@/lib/store";

export default function LoginPage() {
  const { login } = useERStore();
  const router = useRouter();
  const [email, setEmail] = useState("admin@pulsegrid.health");
  const [password, setPassword] = useState("admin123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Try admin@pulsegrid.health / admin123");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-sidebar p-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-base tracking-tight">PulseGrid ER</span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white leading-snug text-balance">
              Emergency Room Management System
            </h2>
            <p className="text-sidebar-foreground/60 text-sm mt-2 leading-relaxed">
              Real-time patient triage, bed allocation, and clinical coordination for modern emergency departments.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Live patient queue with priority scoring" },
              { label: "Automated bed allocation & tracking" },
              { label: "DSA-powered triage algorithms" },
              { label: "Critical care alerts & escalation" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-xs text-sidebar-foreground/70">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-sidebar-foreground/30">
          &copy; {new Date().getFullYear()} PulseGrid Health Systems
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Activity className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground text-base">PulseGrid ER</span>
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-bold text-foreground">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Access your emergency room dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="doctor@hospital.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-foreground font-mono">admin@pulsegrid.health</p>
            <p className="text-xs text-foreground font-mono">admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
