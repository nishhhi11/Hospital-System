"use client";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, Patient, Severity, SEVERITY_ORDER } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { PatientModal } from "@/components/patients/PatientModal";
import { UserPlus, Search, Filter, Edit2, Trash2, ChevronUp, ChevronDown, BedDouble, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "name" | "severity" | "arrival_time" | "age";

export default function PatientsPage() {
  const { patients, deletePatient, updateSeverity } = useERStore();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return patients
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.chief_complaint.toLowerCase().includes(q);
        const matchSev = severityFilter === "All" || p.severity === severityFilter;
        return matchSearch && matchSev;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "severity") cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (sortKey === "arrival_time") cmp = a.arrival_time.localeCompare(b.arrival_time);
        else if (sortKey === "age") cmp = a.age - b.age;
        return sortAsc ? cmp : -cmp;
      });
  }, [patients, search, severityFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : null;

  const handleEdit = (p: Patient) => { setEditPatient(p); setModalOpen(true); };
  const handleAdd = () => { setEditPatient(null); setModalOpen(true); };

  const statusColors: Record<string, string> = {
    "Waiting": "bg-orange-50 text-orange-700 border-orange-200",
    "In Treatment": "bg-blue-50 text-blue-700 border-blue-200",
    "Admitted": "bg-green-50 text-green-700 border-green-200",
    "Discharged": "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <AppLayout>
      <TopBar
        title="Patient Management"
        subtitle={`${patients.length} registered patients`}
        actions={
          <button onClick={handleAdd} className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            Add Patient
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or complaint..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5">
              {(["All", "Critical", "Urgent", "Moderate", "Stable"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                    severityFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-20">ID</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="flex items-center gap-1">Name <SortIcon k="name" /></div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("age")}
                  >
                    <div className="flex items-center gap-1">Age <SortIcon k="age" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Chief Complaint</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("severity")}
                  >
                    <div className="flex items-center gap-1">Severity <SortIcon k="severity" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Bed</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Doctor</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("arrival_time")}
                  >
                    <div className="flex items-center gap-1">Arrival <SortIcon k="arrival_time" /></div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.gender === "M" ? "Male" : "Female"}, {p.age}y</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{p.age}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.chief_complaint}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={p.severity} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full border", statusColors[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.assigned_bed ? (
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          <BedDouble className="w-3 h-3 text-muted-foreground" />
                          {p.assigned_bed}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.doctor ? (
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          <Stethoscope className="w-3 h-3 text-muted-foreground" />
                          {p.doctor}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.arrival_time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => {
                          const dischargeDate = new Date();
                          dischargeDate.setDate(dischargeDate.getDate() + 2); // Auto-calculate 2 days duration
                          useERStore.getState().addMedicalEvent({
                            patient_id: p.id,
                            patient_name: p.name,
                            type: "Expected Discharge",
                            title: `Discharge Assessment for ${p.name}`,
                            date: dischargeDate.toISOString().split("T")[0],
                            time: "10:00",
                            priority: "Moderate",
                            department: "General",
                            doctor: p.doctor || "Unassigned",
                            status: "Upcoming"
                          });
                          alert(`Auto-generated discharge schedule for ${p.name} on ${dischargeDate.toISOString().split("T")[0]}`);
                        }} className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Auto-Schedule Discharge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/></svg>
                        </button>
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit Patient">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No patients match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PatientModal open={modalOpen} onClose={() => setModalOpen(false)} patient={editPatient} />

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-sm text-foreground mb-2">Delete Patient</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Are you sure you want to remove this patient record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => { deletePatient(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
