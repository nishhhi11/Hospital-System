"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Patient, Severity, useERStore, DOCTORS_LIST } from "@/lib/store";

const BLANK: Omit<Patient, "id"> = {
  name: "", age: 30, gender: "M", chief_complaint: "", severity: "Moderate",
  arrival_time: "", assigned_bed: null, doctor: null, notes: "",
  vitals: { bp: "120/80", hr: 72, spo2: 99, temp: 37.0 },
  status: "Waiting",
};

interface Props {
  open: boolean;
  onClose: () => void;
  patient?: Patient | null;
}

export function PatientModal({ open, onClose, patient }: Props) {
  const { addPatient, updatePatient } = useERStore();
  const [form, setForm] = useState<Omit<Patient, "id">>(BLANK);

  useEffect(() => {
    if (patient) {
      const { id: _id, ...rest } = patient;
      setForm(rest);
    } else {
      setForm({ ...BLANK, arrival_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) });
    }
  }, [patient, open]);

  if (!open) return null;

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setVital = (k: string, v: unknown) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: v } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patient) {
      updatePatient(patient.id, form);
    } else {
      addPatient(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">{patient ? "Edit Patient" : "Register New Patient"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Personal */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                <input required value={form.name || ""} onChange={e => set("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Age *</label>
                <input required type="number" min={0} max={120} value={form.age || ""} onChange={e => set("age", +e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Chief Complaint *</label>
                <input required value={form.chief_complaint || ""} onChange={e => set("chief_complaint", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Severity</label>
                <select value={form.severity} onChange={e => set("severity", e.target.value as Severity)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {(["Critical", "Urgent", "Moderate", "Stable"] as Severity[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {["Waiting", "In Treatment", "Admitted", "Discharged"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Arrival Time</label>
                <input type="time" value={form.arrival_time} onChange={e => set("arrival_time", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Attending Doctor</label>
                <select value={form.doctor ?? ""} onChange={e => set("doctor", e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Unassigned</option>
                  {DOCTORS_LIST.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Vitals</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">BP</label>
                <input value={form.vitals.bp} onChange={e => setVital("bp", e.target.value)}
                  placeholder="120/80"
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">HR (bpm)</label>
                <input type="number" value={form.vitals.hr} onChange={e => setVital("hr", +e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">SpO2 (%)</label>
                <input type="number" min={0} max={100} value={form.vitals.spo2} onChange={e => setVital("spo2", +e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Temp (°C)</label>
                <input type="number" step="0.1" value={form.vitals.temp} onChange={e => setVital("temp", +e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Clinical Notes</label>
            <textarea rows={3} value={form.notes || ""} onChange={e => set("notes", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground bg-card hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              {patient ? "Save Changes" : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
