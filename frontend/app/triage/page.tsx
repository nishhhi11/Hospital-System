"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, Patient, Severity, SEVERITY_ORDER } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { PatientModal } from "@/components/patients/PatientModal";
import {
  ArrowUp, ArrowDown, Clock, Heart, Droplets, Thermometer, Wind,
  ChevronRight, Edit2, UserPlus, Activity, Download, IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SEVERITY_LEVELS: Severity[] = ["Critical", "Urgent", "Moderate", "Stable"];

function getPriorityScore(p: Patient): number {
  const baseScore = (3 - SEVERITY_ORDER[p.severity]) * 100;
  const hrScore = p.vitals.hr > 110 ? 30 : p.vitals.hr < 50 ? 30 : 0;
  const spo2Score = p.vitals.spo2 < 90 ? 40 : p.vitals.spo2 < 95 ? 20 : 0;
  const tempScore = p.vitals.temp > 39 ? 15 : 0;
  return baseScore + hrScore + spo2Score + tempScore;
}

export default function TriagePage() {
  const { patients, updateSeverity, updatePatient } = useERStore();
  const [selected, setSelected] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const queue = [...patients]
    .filter((p) => p.status !== "Discharged")
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  const handleSeverityChange = (id: string, sev: Severity) => {
    updateSeverity(id, sev);
    if (selected?.id === id) setSelected((p) => p ? { ...p, severity: sev } : null);
  };

  const vitalColor = (key: string, val: number) => {
    if (key === "hr") return val > 110 || val < 50 ? "text-red-600" : "text-foreground";
    if (key === "spo2") return val < 90 ? "text-red-600" : val < 95 ? "text-orange-600" : "text-green-600";
    if (key === "temp") return val > 39 ? "text-red-600" : val > 38 ? "text-orange-600" : "text-foreground";
    return "text-foreground";
  };

  const getBillingDetails = (p: Patient) => {
    const baseFee = 5000;
    const severityFees = { Critical: 20000, Urgent: 10000, Moderate: 5000, Stable: 2000 };
    const severityFee = severityFees[p.severity];
    const bedFee = (p.status === "In Treatment" || p.status === "Admitted") ? 15000 : 0;
    const total = baseFee + severityFee + bedFee;
    return { baseFee, severityFee, bedFee, total };
  };

  const handleDownloadReport = () => {
    if (!selected) return;
    const bill = getBillingDetails(selected);
    const score = getPriorityScore(selected);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PULSEGRID EMERGENCY DEPARTMENT", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Patient Demographics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Demographics", 14, 45);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${selected.name}`, 14, 55);
    doc.text(`ID: ${selected.id}`, 14, 62);
    doc.text(`Age/Gender: ${selected.age} yrs / ${selected.gender === "M" ? "Male" : "Female"}`, 120, 55);
    
    // Clinical Triage
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Triage", 14, 75);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Severity: ${selected.severity} (Score: ${score})`, 14, 85);
    doc.text(`Arrival: ${selected.arrival_time}`, 120, 85);
    doc.text(`Status: ${selected.status}`, 14, 92);
    doc.text(`Attending: ${selected.doctor || "Unassigned"}`, 120, 92);
    
    doc.text(`Chief Complaint:`, 14, 102);
    doc.setFont("helvetica", "italic");
    const splitComplaint = doc.splitTextToSize(selected.chief_complaint || "None", 180);
    doc.text(splitComplaint, 14, 109);
    
    const noteY = 109 + (splitComplaint.length * 6);
    doc.setFont("helvetica", "normal");
    doc.text(`Clinical Notes:`, 14, noteY + 5);
    doc.setFont("helvetica", "italic");
    const splitNotes = doc.splitTextToSize(selected.notes || "No notes recorded.", 180);
    doc.text(splitNotes, 14, noteY + 12);
    
    let currentY = noteY + 12 + (splitNotes.length * 6) + 10;
    
    // Vitals Table
    autoTable(doc, {
      startY: currentY,
      head: [['Blood Pressure', 'Heart Rate', 'SpO2', 'Temperature']],
      body: [[
        selected.vitals.bp,
        `${selected.vitals.hr} bpm`,
        `${selected.vitals.spo2}%`,
        `${selected.vitals.temp} C`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Estimated Billing Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Estimated Billing Details", 14, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Description', 'Amount (INR)']],
      body: [
        ['Base ER Intake Fee', `Rs. ${bill.baseFee.toFixed(2)}`],
        [`Severity Surcharge (${selected.severity})`, `Rs. ${bill.severityFee.toFixed(2)}`],
        ['Bed / Facility Charge', `Rs. ${bill.bedFee.toFixed(2)}`]
      ],
      foot: [['TOTAL ESTIMATED COST', `Rs. ${bill.total.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
    });

    doc.save(`PulseGrid_Report_${selected.name.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <AppLayout>
      <TopBar
        title="Live Triage Queue"
        subtitle="Priority-sorted patient queue"
        actions={
          <button
            onClick={() => { setEditPatient(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Patient
          </button>
        }
      />
      <div className="flex-1 overflow-hidden flex">
        {/* Queue List */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-border overflow-hidden">
          {/* Severity tabs */}
          <div className="flex border-b border-border">
            {SEVERITY_LEVELS.map((sev) => {
              const count = queue.filter((p) => p.severity === sev).length;
              const colors = {
                Critical: "text-red-600 border-red-500",
                Urgent: "text-orange-600 border-orange-500",
                Moderate: "text-blue-600 border-blue-500",
                Stable: "text-green-600 border-green-500",
              };
              return (
                <div key={sev} className={cn("flex-1 text-center py-2.5 text-xs font-medium border-b-2 border-transparent", colors[sev])}>
                  <div>{count}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">{sev}</div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {queue.map((p, i) => {
              const score = getPriorityScore(p);
              const isSelected = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(isSelected ? null : p)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 border-b border-border transition-colors hover:bg-muted/40",
                    isSelected && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <SeverityBadge severity={p.severity} size="xs" />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground truncate">{p.chief_complaint}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {p.arrival_time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="w-3 h-3" /> Score: {score}
                        </div>
                        <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded", p.status === "Waiting" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600")}>
                          {p.status}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isSelected && "rotate-90")} />
                  </div>
                </button>
              );
            })}
            {queue.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No active patients in queue
              </div>
            )}
          </div>
        </div>

        {/* Patient Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selected.gender === "M" ? "Male" : "Female"}, {selected.age} years old &middot; ID: {selected.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Report
                  </button>
                  <button
                    onClick={() => { setEditPatient(selected); setModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Heart, label: "BP", val: selected.vitals.bp, key: "bp" },
                  { icon: Activity, label: "HR", val: `${selected.vitals.hr} bpm`, key: "hr", num: selected.vitals.hr },
                  { icon: Wind, label: "SpO2", val: `${selected.vitals.spo2}%`, key: "spo2", num: selected.vitals.spo2 },
                  { icon: Thermometer, label: "Temp", val: `${selected.vitals.temp}°C`, key: "temp", num: selected.vitals.temp },
                ].map(({ icon: Icon, label, val, key, num }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <div className={cn("text-base font-bold", num !== undefined ? vitalColor(key, num) : "text-foreground")}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chief Complaint */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Chief Complaint</h3>
                <p className="text-sm text-foreground">{selected.chief_complaint}</p>
              </div>

              {/* Notes */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Clinical Notes</h3>
                <p className="text-sm text-foreground leading-relaxed">{selected.notes || "No notes recorded."}</p>
              </div>

              {/* Assignment */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Assigned Bed</div>
                    <div className="text-sm font-medium text-foreground">{selected.assigned_bed ?? "None"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Attending Doctor</div>
                    <div className="text-sm font-medium text-foreground">{selected.doctor ?? "Unassigned"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Arrival Time</div>
                    <div className="text-sm font-mono font-medium text-foreground">{selected.arrival_time}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Priority Score</div>
                    <div className="text-sm font-bold text-primary">{getPriorityScore(selected)}</div>
                  </div>
                </div>
              </div>

              {/* Estimated Billing */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="w-4 h-4 text-green-600" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Billing</h3>
                </div>
                {(() => {
                  const bill = getBillingDetails(selected);
                  return (
                    <div className="space-y-2 text-sm text-foreground">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Intake Fee</span>
                        <span>₹{bill.baseFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Severity Surcharge ({selected.severity})</span>
                        <span>₹{bill.severityFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Bed/Facility Charge</span>
                        <span>₹{bill.bedFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold">
                        <span>Total Estimated Cost</span>
                        <span className="text-primary">₹{bill.total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Severity Update */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Severity</h3>
                <div className="flex gap-2">
                  {SEVERITY_LEVELS.map((sev) => {
                    const cfg = { Critical: "border-red-300 text-red-700 bg-red-50 hover:bg-red-100", Urgent: "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100", Moderate: "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100", Stable: "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" };
                    const active = selected.severity === sev;
                    return (
                      <button
                        key={sev}
                        onClick={() => handleSeverityChange(selected.id, sev)}
                        className={cn("flex-1 py-2 text-xs font-semibold rounded-md border transition-all", cfg[sev], active && "ring-2 ring-offset-1 ring-primary")}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status update */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {(["Waiting", "In Treatment", "Admitted", "Discharged"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => { updatePatient(selected.id, { status: st }); setSelected((p) => p ? { ...p, status: st } : null); }}
                      className={cn("px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                        selected.status === st ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a patient from the queue to view details
            </div>
          )}
        </div>
      </div>
      <PatientModal open={modalOpen} onClose={() => setModalOpen(false)} patient={editPatient} />
    </AppLayout>
  );
}
