"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore } from "@/lib/store";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

const HOURLY = [
  { h: "00", admissions: 2, discharges: 1 }, { h: "02", admissions: 1, discharges: 2 },
  { h: "04", admissions: 1, discharges: 0 }, { h: "06", admissions: 3, discharges: 2 },
  { h: "08", admissions: 9, discharges: 4 }, { h: "10", admissions: 14, discharges: 7 },
  { h: "12", admissions: 10, discharges: 9 }, { h: "14", admissions: 12, discharges: 11 },
  { h: "16", admissions: 8, discharges: 6 }, { h: "18", admissions: 11, discharges: 8 },
  { h: "20", admissions: 7, discharges: 5 }, { h: "22", admissions: 4, discharges: 3 },
];

const WEEKLY = [
  { day: "Mon", patients: 42 }, { day: "Tue", patients: 38 }, { day: "Wed", patients: 55 },
  { day: "Thu", patients: 49 }, { day: "Fri", patients: 61 }, { day: "Sat", patients: 72 },
  { day: "Sun", patients: 58 },
];

const WAIT_TIME = [
  { h: "06", wait: 8 }, { h: "08", wait: 15 }, { h: "10", wait: 28 }, { h: "12", wait: 22 },
  { h: "14", wait: 31 }, { h: "16", wait: 38 }, { h: "18", wait: 25 }, { h: "20", wait: 18 },
];

const COMPLAINT_TYPES = [
  { name: "Cardiac", value: 18 }, { name: "Trauma", value: 24 }, { name: "Respiratory", value: 15 },
  { name: "Neurological", value: 12 }, { name: "GI", value: 14 }, { name: "Other", value: 17 },
];

const DOCTOR_PERF = [
  { doctor: "Dr. Patel", patients: 8, avgWait: 12 },
  { doctor: "Dr. Kim", patients: 6, avgWait: 18 },
  { doctor: "Dr. Okonkwo", patients: 7, avgWait: 14 },
  { doctor: "Dr. Reyes", patients: 9, avgWait: 10 },
  { doctor: "Dr. Walsh", patients: 5, avgWait: 22 },
];

const COLORS = ["#3b82f6", "#ef4444", "#f97316", "#22c55e", "#8b5cf6", "#06b6d4"];

const RADAR_DATA = [
  { metric: "Throughput", value: 78 },
  { metric: "Bed Util.", value: 62 },
  { metric: "Triage Speed", value: 85 },
  { metric: "Response", value: 91 },
  { metric: "Satisfaction", value: 74 },
  { metric: "Safety", value: 96 },
];

export default function AnalyticsPage() {
  const { patients, beds } = useERStore();

  const bySeverity = [
    { name: "Critical", value: patients.filter((p) => p.severity === "Critical").length, color: "#ef4444" },
    { name: "Urgent", value: patients.filter((p) => p.severity === "Urgent").length, color: "#f97316" },
    { name: "Moderate", value: patients.filter((p) => p.severity === "Moderate").length, color: "#3b82f6" },
    { name: "Stable", value: patients.filter((p) => p.severity === "Stable").length, color: "#22c55e" },
  ];

  const kpis = [
    { label: "Avg Wait Time", value: "23 min", change: "+4 min", up: true },
    { label: "Avg LOS", value: "4.2 hrs", change: "-0.3 hrs", up: false },
    { label: "Throughput", value: "87/day", change: "+12%", up: false },
    { label: "Bed Turnover", value: "3.1×", change: "+0.2", up: false },
  ];

  return (
    <AppLayout>
      <TopBar title="Analytics" subtitle="Emergency department performance metrics" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{k.value}</p>
              <p className={`text-xs mt-1 font-medium ${k.up ? "text-red-600" : "text-green-600"}`}>
                {k.change} vs yesterday
              </p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Hourly admissions */}
          <div className="col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Admissions vs Discharges (Hourly)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={HOURLY} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="admissions" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="discharges" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Distribution */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Severity Distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {bySeverity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {bySeverity.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.name}: {s.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Weekly trends */}
          <div className="col-span-1 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Patient Volume</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={WEEKLY} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Wait time */}
          <div className="col-span-1 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Avg Wait Time (min)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={WAIT_TIME} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="wait" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance radar */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Dept. Performance Score</h2>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Types + Doctor Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Complaint Categories</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={COMPLAINT_TYPES} layout="vertical" margin={{ left: 20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {COMPLAINT_TYPES.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Doctor Performance</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Doctor</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Patients</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Avg Wait</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-right">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DOCTOR_PERF.map((d) => (
                  <tr key={d.doctor} className="hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{d.doctor}</td>
                    <td className="px-4 py-3 text-sm text-center text-foreground">{d.patients}</td>
                    <td className="px-4 py-3 text-sm text-center text-foreground">{d.avgWait} min</td>
                    <td className="px-5 py-3">
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(d.patients / 10) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
