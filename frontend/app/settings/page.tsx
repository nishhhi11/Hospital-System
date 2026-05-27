"use client";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, DOCTORS_LIST } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  User, Bell, Shield, Building2, Users, Activity,
  Save, ChevronRight, Eye, EyeOff, Check,
} from "lucide-react";

type Section = "profile" | "hospital" | "notifications" | "staff" | "security" | "system";

const SECTIONS: { key: Section; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "hospital", label: "Hospital", icon: Building2 },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "staff", label: "Staff", icon: Users },
  { key: "security", label: "Security", icon: Shield },
  { key: "system", label: "System", icon: Activity },
];

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
      {saved ? "Saved!" : "Save changes"}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn("relative w-9 h-5 rounded-full transition-colors shrink-0", checked ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <div className="ml-8 shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser, setCurrentUser } = useERStore();
  const [section, setSection] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize state from localStorage
  const [profile, setProfile] = useState({ name: currentUser.name, role: currentUser.role, email: currentUser.email, phone: "+1 (555) 234-5678" });
  const [hospital, setHospital] = useState({ name: "Metro General Hospital", address: "1200 Medical Pkwy, Los Angeles, CA 90001", department: "Emergency Medicine", capacity: "24", code: "MGH-ER" });
  const [notifs, setNotifs] = useState({ code_blue: true, stemi: true, capacity: true, lab_results: false, shift_reminder: true, email_alerts: false, sms_alerts: true });
  const [security, setSecurity] = useState({ two_fa: false, session_timeout: "60", auto_lock: true });
  const [system, setSystem] = useState({ dark_mode: false, compact_view: false, auto_refresh: true, refresh_interval: "30", sound_alerts: true });
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("settings_profile");
      const savedHospital = localStorage.getItem("settings_hospital");
      const savedNotifs = localStorage.getItem("settings_notifs");
      const savedSecurity = localStorage.getItem("settings_security");
      const savedSystem = localStorage.getItem("settings_system");

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedHospital) setHospital(JSON.parse(savedHospital));
      if (savedNotifs) setNotifs(JSON.parse(savedNotifs));
      if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
      if (savedSystem) setSystem(JSON.parse(savedSystem));
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    }
    setMounted(true);
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("settings_profile", JSON.stringify(profile));
      localStorage.setItem("settings_hospital", JSON.stringify(hospital));
      localStorage.setItem("settings_notifs", JSON.stringify(notifs));
      localStorage.setItem("settings_security", JSON.stringify(security));
      localStorage.setItem("settings_system", JSON.stringify(system));
      
      setCurrentUser(profile);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  return (
    <AppLayout>
      <TopBar title="Settings" subtitle="Manage your account and system preferences" />
      {!mounted ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 border-r border-border p-3 overflow-y-auto">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSection(key)}
              className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors",
                section === key ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
              )}>
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                {label}
              </div>
              {section === key && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            {section === "profile" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Profile</h2>
                <p className="text-xs text-muted-foreground mb-6">Your personal information and contact details.</p>
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                      {profile.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.role}</div>
                    </div>
                  </div>
                  {[
                    { label: "Full Name", key: "name" as const, type: "text" },
                    { label: "Role", key: "role" as const, type: "text" },
                    { label: "Email", key: "email" as const, type: "email" },
                    { label: "Phone", key: "phone" as const, type: "tel" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
                      <input type={type} value={profile[key] || ""} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved} />
                  </div>
                </div>
              </div>
            )}

            {section === "hospital" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Hospital Configuration</h2>
                <p className="text-xs text-muted-foreground mb-6">Configure your emergency department settings.</p>
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  {[
                    { label: "Hospital Name", key: "name" as const },
                    { label: "Address", key: "address" as const },
                    { label: "Department", key: "department" as const },
                    { label: "Bed Capacity", key: "capacity" as const, type: "number" },
                    { label: "Department Code", key: "code" as const },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
                      <input type={type ?? "text"} value={hospital[key] || ""} onChange={(e) => setHospital({ ...hospital, [key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved} />
                  </div>
                </div>
              </div>
            )}

            {section === "notifications" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Notifications</h2>
                <p className="text-xs text-muted-foreground mb-6">Control which alerts and notifications you receive.</p>
                <div className="bg-card border border-border rounded-xl px-6 divide-y divide-border">
                  <SettingRow label="Code Blue Alert" desc="Immediate notification for cardiac arrest events">
                    <Toggle checked={notifs.code_blue} onChange={(v) => setNotifs({ ...notifs, code_blue: v })} />
                  </SettingRow>
                  <SettingRow label="STEMI Alerts" desc="Notify on ST-elevation myocardial infarction detection">
                    <Toggle checked={notifs.stemi} onChange={(v) => setNotifs({ ...notifs, stemi: v })} />
                  </SettingRow>
                  <SettingRow label="Capacity Warnings" desc="Alert when bed occupancy exceeds 80%">
                    <Toggle checked={notifs.capacity} onChange={(v) => setNotifs({ ...notifs, capacity: v })} />
                  </SettingRow>
                  <SettingRow label="Lab Results" desc="Notify when lab results are ready for your patients">
                    <Toggle checked={notifs.lab_results} onChange={(v) => setNotifs({ ...notifs, lab_results: v })} />
                  </SettingRow>
                  <SettingRow label="Shift Reminders" desc="30-minute reminder before handover">
                    <Toggle checked={notifs.shift_reminder} onChange={(v) => setNotifs({ ...notifs, shift_reminder: v })} />
                  </SettingRow>
                  <SettingRow label="Email Alerts" desc="Receive critical alerts via email">
                    <Toggle checked={notifs.email_alerts} onChange={(v) => setNotifs({ ...notifs, email_alerts: v })} />
                  </SettingRow>
                  <SettingRow label="SMS Alerts" desc="Receive critical alerts via SMS">
                    <Toggle checked={notifs.sms_alerts} onChange={(v) => setNotifs({ ...notifs, sms_alerts: v })} />
                  </SettingRow>
                </div>
                <div className="flex justify-end mt-4">
                  <SaveButton onClick={handleSave} saved={saved} />
                </div>
              </div>
            )}

            {section === "staff" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Staff Management</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage attending physicians and ER staff.</p>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Doctor</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Specialty</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Patients</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {DOCTORS_LIST.map((doc, i) => {
                        const specialties = ["Emergency Medicine", "Cardiology", "Neurology", "Internal Medicine", "Pulmonology", "Pediatrics"];
                        const statuses = ["On Duty", "On Duty", "On Break", "On Duty", "On Duty", "Off Duty"];
                        const counts = [8, 6, 7, 9, 5, 0];
                        return (
                          <tr key={doc} className="hover:bg-muted/30">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {doc.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-foreground">{doc}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{specialties[i]}</td>
                            <td className="px-4 py-3">
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                                statuses[i] === "On Duty" ? "bg-green-50 text-green-700" :
                                statuses[i] === "On Break" ? "bg-orange-50 text-orange-700" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {statuses[i]}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-right text-foreground font-medium">{counts[i]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section === "security" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Security</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage your account security preferences.</p>
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Change Password</h3>
                    {[
                      { label: "Current Password", key: "current" as const },
                      { label: "New Password", key: "new" as const },
                      { label: "Confirm New Password", key: "confirm" as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="mb-3">
                        <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
                        <div className="relative">
                          <input type={showPw ? "text" : "password"} value={pw[key] || ""} onChange={(e) => setPw({ ...pw, [key]: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring pr-9" />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border divide-y divide-border">
                    <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of security to your account">
                      <Toggle checked={security.two_fa} onChange={(v) => setSecurity({ ...security, two_fa: v })} />
                    </SettingRow>
                    <SettingRow label="Auto-lock on Inactivity" desc="Automatically lock session after inactivity period">
                      <Toggle checked={security.auto_lock} onChange={(v) => setSecurity({ ...security, auto_lock: v })} />
                    </SettingRow>
                    <SettingRow label="Session Timeout" desc="Minutes before automatic logout">
                      <select value={security.session_timeout || ""} onChange={(e) => setSecurity({ ...security, session_timeout: e.target.value })}
                        className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                        {["15", "30", "60", "120"].map((v) => <option key={v}>{v} min</option>)}
                      </select>
                    </SettingRow>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton onClick={handleSave} saved={saved} />
                  </div>
                </div>
              </div>
            )}

            {section === "system" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">System Preferences</h2>
                <p className="text-xs text-muted-foreground mb-6">Configure display and system behavior.</p>
                <div className="bg-card border border-border rounded-xl px-6 divide-y divide-border">
                  <SettingRow label="Compact View" desc="Reduce padding and spacing in tables">
                    <Toggle checked={system.compact_view} onChange={(v) => setSystem({ ...system, compact_view: v })} />
                  </SettingRow>
                  <SettingRow label="Auto-Refresh Queue" desc="Automatically refresh patient queue at intervals">
                    <Toggle checked={system.auto_refresh} onChange={(v) => setSystem({ ...system, auto_refresh: v })} />
                  </SettingRow>
                  <SettingRow label="Refresh Interval" desc="How often to refresh live data">
                    <select value={system.refresh_interval || ""} onChange={(e) => setSystem({ ...system, refresh_interval: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                      {["10", "30", "60"].map((v) => <option key={v}>{v}s</option>)}
                    </select>
                  </SettingRow>
                  <SettingRow label="Sound Alerts" desc="Play audio for critical notifications">
                    <Toggle checked={system.sound_alerts} onChange={(v) => setSystem({ ...system, sound_alerts: v })} />
                  </SettingRow>
                </div>
                <div className="mt-6 bg-card border border-border rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">System Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Version", value: "PulseGrid ER v2.4.1" },
                      { label: "Database", value: "In-memory (demo)" },
                      { label: "Last Sync", value: "Just now" },
                      { label: "Environment", value: "Production" },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-xs">
                        <div className="text-muted-foreground">{label}</div>
                        <div className="font-medium text-foreground mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <SaveButton onClick={handleSave} saved={saved} />
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </AppLayout>
  );
}
