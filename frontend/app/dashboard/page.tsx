"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { SEVERITY_ORDER } from "@/lib/store";
import {
  Users, BedDouble, AlertTriangle, Activity,
  Clock, TrendingUp, ArrowUpRight, CheckCircle2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Link from "next/link";

const HOURLY_DATA = [
  { h: "06", patients: 3 }, { h: "07", patients: 5 }, { h: "08", patients: 9 },
  { h: "09", patients: 14 }, { h: "10", patients: 18 }, { h: "11", patients: 22 },
  { h: "12", patients: 19 }, { h: "13", patients: 16 }, { h: "14", patients: 20 },
  { h: "15", patients: 24 }, { h: "16", patients: 21 },
];

export default function DashboardPage() {
  const { patients, beds, alerts } = useERStore();

  const critical = patients.filter((p) => p.severity === "Critical").length;
  const urgent = patients.filter((p) => p.severity === "Urgent").length;
  const waiting = patients.filter((p) => p.status === "Waiting").length;
  const inTreatment = patients.filter((p) => p.status === "In Treatment").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const criticalAlerts = alerts.filter((a) => a.level === "critical" && !a.read).length;

  const recentPatients = [...patients]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 5);

  const stats = [
    {
      label: "Total Patients",
      value: patients.length,
      sub: `${inTreatment} in treatment`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/patients",
    },
    {
      label: "Critical / Urgent",
      value: `${critical} / ${urgent}`,
      sub: `${waiting} waiting triage`,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/triage",
    },
    {
      label: "Available Beds",
      value: availableBeds,
      sub: `${occupiedBeds} occupied of ${beds.length}`,
      icon: BedDouble,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/beds",
    },
    {
      label: "Active Alerts",
      value: unreadAlerts,
      sub: `${criticalAlerts} critical`,
      icon: Activity,
      color: criticalAlerts > 0 ? "text-red-600" : "text-orange-600",
      bg: criticalAlerts > 0 ? "bg-red-50" : "bg-orange-50",
      href: "/alerts",
    },
  ];

  const bedOccupancyPct = Math.round((occupiedBeds / beds.length) * 100);

  return (
    <AppLayout>
      <TopBar title="Dashboard" subtitle="Emergency Room Overview" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Volume chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Patient Volume – Today</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Hourly arrivals</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                +12% vs yesterday
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={HOURLY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="patients" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bed Capacity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Bed Capacity</h2>
            <div className="space-y-3">
              {(["Trauma", "ICU", "General", "Observation"] as const).map((type) => {
                const total = beds.filter((b) => b.type === type).length;
                const occ = beds.filter((b) => b.type === type && b.status === "Occupied").length;
                const pct = total > 0 ? Math.round((occ / total) * 100) : 0;
                const color = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-orange-400" : "bg-green-500";
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{type}</span>
                      <span className="text-muted-foreground">{occ}/{total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall occupancy</span>
              <span className={`text-sm font-bold ${bedOccupancyPct >= 80 ? "text-red-600" : bedOccupancyPct >= 60 ? "text-orange-600" : "text-green-600"}`}>
                {bedOccupancyPct}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Priority Queue Preview */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Priority Queue</h2>
              <Link href="/triage" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentPatients.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">Age {p.age}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{p.chief_complaint}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <SeverityBadge severity={p.severity} size="xs" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {p.arrival_time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Recent Alerts</h2>
              <Link href="/alerts" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.level === "critical" ? "bg-red-500" : a.level === "warning" ? "bg-orange-400" : "bg-blue-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${a.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{a.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{a.time}</span>
                      {a.read && <CheckCircle2 className="w-3 h-3 text-muted-foreground/50" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
