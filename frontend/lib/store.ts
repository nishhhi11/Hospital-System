"use client";
import { create } from "zustand";
import { fetchPatients, addPatient as apiAddPatient } from "./api";

export type Severity = "Critical" | "Urgent" | "Moderate" | "Stable";
export type BedStatus = "Occupied" | "Available" | "Maintenance" | "Reserved";
export type AlertLevel = "critical" | "warning" | "info";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  chief_complaint: string;
  severity: Severity;
  arrival_time: string;
  assigned_bed: string | null;
  doctor: string | null;
  notes: string;
  vitals: { bp: string; hr: number; spo2: number; temp: number };
  status: "Waiting" | "In Treatment" | "Discharged" | "Admitted";
}

export interface Bed {
  id: string;
  room: string;
  type: "General" | "ICU" | "Trauma" | "Observation";
  status: BedStatus;
  patient_id: string | null;
  floor: number;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  time: string;
  read: boolean;
  category: string;
}

export interface MedicalEvent {
  id: string;
  patient_id: string;
  patient_name: string;
  type: string;
  title: string;
  date: string;
  time: string;
  priority: Severity;
  department: string;
  doctor: string;
  status: string;
}

export const DOCTORS_LIST = [
  "Dr. Patel", "Dr. Kim", "Dr. Okonkwo", "Dr. Reyes", "Dr. Walsh", "Dr. Nguyen",
];

const INITIAL_PATIENTS: Patient[] = [];

const INITIAL_BEDS: Bed[] = [];

const INITIAL_ALERTS: Alert[] = [];

export const SEVERITY_ORDER: Record<Severity, number> = { Critical: 0, Urgent: 1, Moderate: 2, Stable: 3 };

export interface ERStore {
  patients: Patient[];
  beds: Bed[];
  alerts: Alert[];
  avlTree: any;
  isLoggedIn: boolean;
  currentUser: { name: string; role: string; email: string };
  syncStatus: "synced" | "syncing" | "error";
  lastSynced: string | null;
  
  syncWithBackend: () => Promise<void>;
  setupSocket: () => (() => void) | void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  setCurrentUser: (user: { name: string; role: string; email: string }) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addPatient: (p: Omit<Patient, "id">) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => Promise<void>;
  updateSeverity: (id: string, severity: Severity) => Promise<void>;
  assignBed: (bedId: string, patientId: string | null) => Promise<void>;
  updateBedStatus: (bedId: string, status: BedStatus) => void;
  markAlertRead: (id: string) => void;
  markAllRead: () => void;
  addAlert: (a: Omit<Alert, "id">) => void;
  dismissAlert: (id: string) => void;
  undoAction: () => Promise<any>;

  // Medical Events
  medicalEvents: MedicalEvent[];
  addMedicalEvent: (e: Partial<MedicalEvent>) => Promise<void>;
  updateMedicalEventStatus: (id: string, status: string) => Promise<void>;
  deleteMedicalEvent: (id: string) => Promise<void>;
}

export const useERStore = create<ERStore>((set, get) => ({
  patients: INITIAL_PATIENTS,
  beds: INITIAL_BEDS,
  alerts: INITIAL_ALERTS,
  avlTree: null,
  medicalEvents: [],
  isLoggedIn: false,
  currentUser: { name: "Dr. Alex Morgan", role: "ER Attending", email: "alex.morgan@pulsegrid.health" },
  syncStatus: "synced",
  lastSynced: null,

  syncWithBackend: async () => {
    const state = get();
    set({ syncStatus: "syncing" });

    const safeFetch = async (url: string, fallback: any) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return fallback;
        return await response.json();
      } catch (e) {
        console.warn(`Sync failed for ${url}:`, e);
        return fallback;
      }
    };

    const API_URL = "http://localhost:5000/api";

    try {
      const [patients, beds, alerts, avlTree, events] = await Promise.all([
        safeFetch(`${API_URL}/patients`, state.patients),
        safeFetch(`${API_URL}/beds`, state.beds),
        safeFetch(`${API_URL}/alerts`, state.alerts),
        safeFetch(`${API_URL}/dsa/avl`, state.avlTree),
        safeFetch(`${API_URL}/events`, state.medicalEvents)
      ]);
      
      set({ 
        patients,
        beds,
        alerts,
        avlTree,
        medicalEvents: events,
        syncStatus: "synced", 
        lastSynced: new Date().toLocaleTimeString() 
      });
    } catch (error) {
      set({ syncStatus: "error" });
    }
  },

  setupSocket: () => {
    try {
      const { io } = require("socket.io-client");
      const socket = io("http://localhost:5000");
      
      socket.on("data_changed", () => {
        console.log("Real-time update received");
        get().syncWithBackend();
      });

      socket.on("connect", () => console.log("Connected to PulseGrid Real-time Engine"));
      return () => socket.disconnect();
    } catch (e) {
      console.warn("Socket.io-client failed to initialize", e);
    }
  },

  setLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
  setCurrentUser: (user) => set({ currentUser: user }),

  login: async (email, password) => {
    // Only using demo auth
    if (email === "admin@pulsegrid.health" && password === "admin123") {
      set(() => ({ isLoggedIn: true }));
      return true;
    }
    return false;
  },
  logout: async () => {
    set(() => ({ isLoggedIn: false }));
  },

  addPatient: async (p) => {
    // Optimistic update
    const tempId = `P-TEMP-${Date.now()}`;
    const newPatient = { ...p, id: tempId } as Patient;
    set(s => ({ patients: [...s.patients, newPatient] }));

    try {
      const result = await apiAddPatient(p);
      if (result.status === "success") {
        await get().syncWithBackend();
      }
    } catch (error) {
      console.error("Add patient to backend failed", error);
      // If it failed, we already have it locally as temp, maybe keep it or show error
    }
  },

  updatePatient: async (id, updates) => {
    // Optimistic update
    const previousPatients = get().patients;
    let fullPatient: Patient | null = null;
    
    set((s) => {
      const newPatients = s.patients.map((p) => {
        if (p.id === id) {
          fullPatient = { ...p, ...updates };
          return fullPatient as Patient;
        }
        return p;
      });
      return { patients: newPatients };
    });

    if (!fullPatient) return;

    try {
      await fetch(`http://localhost:5000/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPatient),
      });
      await get().syncWithBackend();
    } catch (error) {
      console.error("Update patient sync failed", error);
      set({ patients: previousPatients }); // Rollback
    }
  },

  deletePatient: async (id) => {
    // Optimistic update
    const previousPatients = get().patients;
    set(s => ({ patients: s.patients.filter(p => p.id !== id) }));

    try {
      await fetch(`${"http://localhost:5000/api"}/patients/${id}`, {
        method: "DELETE",
      });
      await get().syncWithBackend();
    } catch (error) {
      console.error("Delete patient sync failed", error);
      set({ patients: previousPatients }); // Rollback
    }
  },

  updateSeverity: async (id, severity) => {
    // Optimistic update
    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? { ...p, severity } : p)),
    }));

    try {
      await fetch(`${"http://localhost:5000/api"}/patients/${id}/severity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity }),
      });
      await get().syncWithBackend();
    } catch (error) {
      console.error("Update severity sync failed", error);
    }
  },

  assignBed: async (bedId, patientId) => {
    // Optimistic update
    set((s) => {
      const beds = s.beds.map((b) => {
        if (b.id === bedId)
          return { ...b, patient_id: patientId, status: (patientId ? "Occupied" : "Available") as BedStatus };
        if (patientId && b.patient_id === patientId)
          return { ...b, patient_id: null, status: "Available" as BedStatus };
        return b;
      });
      const patients = s.patients.map((p) => {
        if (p.id === patientId) return { ...p, assigned_bed: bedId };
        if (patientId === null && p.assigned_bed === bedId) return { ...p, assigned_bed: null };
        return p;
      });
      return { beds, patients };
    });

    try {
      if (patientId) {
        await fetch(`${"http://localhost:5000/api"}/beds/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bedId, patientId }),
        });
      } else {
        await fetch(`${"http://localhost:5000/api"}/beds/discharge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bedId }),
        });
      }
      await get().syncWithBackend();
    } catch (error) {
      console.error("Bed assignment sync failed", error);
    }
  },

  updateBedStatus: (bedId, status) =>
    set((s) => ({
      beds: s.beds.map((b) => (b.id === bedId ? { ...b, status } : b)),
    })),

  markAlertRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),

  markAllRead: () =>
    set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),

  addAlert: (a) =>
    set((s) => ({ alerts: [{ ...a, id: `A${Date.now()}` }, ...s.alerts] })),

  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  
  undoAction: async () => {
    try {
      const res = await fetch(`${"http://localhost:5000/api"}/undo`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.status === "success") {
        await get().syncWithBackend();
        return data;
      } else {
        throw new Error(data.error || "Failed to undo");
      }
    } catch (error) {
      console.error("Undo failed", error);
      throw error;
    }
  },

  addMedicalEvent: async (e) => {
    try {
      await fetch(`${"http://localhost:5000/api"}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      await get().syncWithBackend();
    } catch (err) {
      console.error(err);
    }
  },

  updateMedicalEventStatus: async (id, status) => {
    try {
      await fetch(`${"http://localhost:5000/api"}/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await get().syncWithBackend();
    } catch (err) {
      console.error(err);
    }
  },

  deleteMedicalEvent: async (id) => {
    try {
      await fetch(`${"http://localhost:5000/api"}/events/${id}`, {
        method: "DELETE",
      });
      await get().syncWithBackend();
    } catch (err) {
      console.error(err);
    }
  },
}));
