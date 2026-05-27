"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, Bed, BedStatus } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { cn } from "@/lib/utils";
import { BedDouble, User, X, CheckCircle, Wrench, AlertCircle, Clock } from "lucide-react";

const BED_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Trauma: { bg: "bg-red-50", text: "text-red-700", icon: "border-red-200" },
  ICU: { bg: "bg-orange-50", text: "text-orange-700", icon: "border-orange-200" },
  General: { bg: "bg-blue-50", text: "text-blue-700", icon: "border-blue-200" },
  Observation: { bg: "bg-green-50", text: "text-green-700", icon: "border-green-200" },
};

const STATUS_CONFIG: Record<BedStatus, { icon: typeof CheckCircle; color: string; bg: string }> = {
  Available: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  Occupied: { icon: User, color: "text-blue-600", bg: "bg-blue-50" },
  Maintenance: { icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
  Reserved: { icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
};

export default function BedsPage() {
  const { beds, patients, assignBed, updateBedStatus } = useERStore();
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<BedStatus | "All">("All");
  const [patientSearch, setPatientSearch] = useState("");
  const [assignMode, setAssignMode] = useState(false);

  const available = beds.filter((b) => b.status === "Available").length;
  const occupied = beds.filter((b) => b.status === "Occupied").length;

  const filtered = beds.filter((b) => {
    const matchType = typeFilter === "All" || b.type === typeFilter;
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchType && matchStatus;
  });

  const unassignedPatients = patients.filter(
    (p) => p.status !== "Discharged" && !p.assigned_bed
  ).filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleAssign = (patientId: string) => {
    if (!selectedBed) return;
    assignBed(selectedBed.id, patientId);
    setSelectedBed((b) => b ? { ...b, patient_id: patientId, status: "Occupied" } : null);
    setAssignMode(false);
    setPatientSearch("");
  };

  const handleUnassign = () => {
    if (!selectedBed || !selectedBed.patient_id) return;
    assignBed(selectedBed.id, null);
    setSelectedBed((b) => b ? { ...b, patient_id: null, status: "Available" } : null);
  };

  const handleStatusChange = (status: BedStatus) => {
    if (!selectedBed) return;
    updateBedStatus(selectedBed.id, status);
    setSelectedBed((b) => b ? { ...b, status } : null);
  };

  const patient = selectedBed ? patients.find((p) => p.id === selectedBed.patient_id) : null;

  return (
    <AppLayout>
      <TopBar
        title="Bed Allocation"
        subtitle={`${available} available · ${occupied} occupied · ${beds.length} total`}
      />
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="flex gap-4 mb-5">
            {(["Available", "Occupied", "Reserved", "Maintenance"] as BedStatus[]).map((s) => {
              const count = beds.filter((b) => b.status === s).length;
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border", cfg.bg)}>
                  <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                  <div>
                    <div className={cn("text-lg font-bold leading-none", cfg.color)}>{count}</div>
                    <div className="text-[10px] text-muted-foreground">{s}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["All", "Trauma", "ICU", "General", "Observation"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                  typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                )}>
                {t}
              </button>
            ))}
            <div className="w-px h-6 bg-border self-center" />
            {(["All", "Available", "Occupied", "Reserved", "Maintenance"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                )}>
                {s}
              </button>
            ))}
          </div>

          {/* Bed Grid by type */}
          {(["Trauma", "ICU", "General", "Observation"] as const).filter(t => typeFilter === "All" || typeFilter === t).map((type) => {
            const typeBeds = filtered.filter((b) => b.type === type);
            if (typeBeds.length === 0) return null;
            const cfg = BED_TYPE_COLORS[type];
            return (
              <div key={type} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("px-2 py-0.5 text-xs font-semibold rounded border", cfg.bg, cfg.text, cfg.icon)}>
                    {type}
                  </span>
                  <span className="text-xs text-muted-foreground">{typeBeds.length} beds</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {typeBeds.map((bed) => {
                    const occupantPatient = patients.find((p) => p.id === bed.patient_id);
                    const isSelected = selectedBed?.id === bed.id;
                    const stCfg = STATUS_CONFIG[bed.status];
                    return (
                      <button
                        key={bed.id}
                        onClick={() => setSelectedBed(isSelected ? null : bed)}
                        className={cn(
                          "relative p-3 rounded-xl border text-left transition-all hover:shadow-sm",
                          isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" :
                            bed.status === "Available" ? "bg-card border-border hover:border-primary/50" :
                            bed.status === "Occupied" ? "bg-blue-50 border-blue-200" :
                            bed.status === "Maintenance" ? "bg-orange-50 border-orange-200 opacity-70" :
                            "bg-purple-50 border-purple-200"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center mb-2", stCfg.bg)}>
                          <stCfg.icon className={cn("w-3 h-3", stCfg.color)} />
                        </div>
                        <div className="text-sm font-bold text-foreground">{bed.id}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {occupantPatient ? occupantPatient.name.split(" ")[0] : bed.status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detail */}
        {selectedBed && (
          <div className="w-80 shrink-0 border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{selectedBed.room}</h2>
                <p className="text-xs text-muted-foreground">{selectedBed.id} &middot; Floor {selectedBed.floor}</p>
              </div>
              <button onClick={() => setSelectedBed(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status selector */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["Available", "Occupied", "Reserved", "Maintenance"] as BedStatus[]).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                          selectedBed.status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
                        )}>
                        <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occupant */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Occupant</h3>
                {patient ? (
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{patient.name}</div>
                        <div className="text-xs text-muted-foreground">{patient.id} &middot; Age {patient.age}</div>
                      </div>
                      <SeverityBadge severity={patient.severity} size="xs" />
                    </div>
                    <div className="text-xs text-muted-foreground">{patient.chief_complaint}</div>
                    <div className="text-xs text-muted-foreground">Doctor: {patient.doctor ?? "Unassigned"}</div>
                    <button onClick={handleUnassign}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors">
                      Remove from bed
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BedDouble className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Bed is unoccupied</p>
                    {selectedBed.status === "Available" && (
                      <button
                        onClick={() => setAssignMode(!assignMode)}
                        className="mt-3 px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        {assignMode ? "Cancel" : "Assign Patient"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Assign panel */}
              {assignMode && !patient && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assign Patient</h3>
                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full px-3 py-2 text-xs border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-2"
                  />
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {unassignedPatients.map((p) => (
                      <button key={p.id} onClick={() => handleAssign(p.id)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{p.chief_complaint}</div>
                        </div>
                        <SeverityBadge severity={p.severity} size="xs" />
                      </button>
                    ))}
                    {unassignedPatients.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">No unassigned patients</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
