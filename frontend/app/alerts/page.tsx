"use client";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, MedicalEvent, Severity } from "@/lib/store";
import { AlertTriangle, Clock, Calendar, CheckCircle2, X, Plus, Users, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AlertCenterPage() {
  const { medicalEvents, patients, addMedicalEvent, updateMedicalEventStatus } = useERStore();
  const [filter, setFilter] = useState<"All" | "Upcoming" | "Overdue" | "Completed">("All");
  const [addOpen, setAddOpen] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<MedicalEvent>>({
    type: "Surgery",
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    priority: "Urgent",
    patient_id: "",
    department: "General",
    doctor: "Unassigned",
  });

  const now = new Date();
  
  // Calculate statuses dynamically
  const enrichedEvents = useMemo(() => {
    return medicalEvents.map(e => {
      let currentStatus = e.status;
      if (currentStatus !== "Completed" && currentStatus !== "Acknowledged") {
        const eventTime = new Date(`${e.date}T${e.time}`);
        if (eventTime < now) {
          currentStatus = "Overdue";
        } else {
          currentStatus = "Upcoming";
        }
      }
      return { ...e, currentStatus };
    }).sort((a, b) => {
      if (a.currentStatus === "Overdue" && b.currentStatus !== "Overdue") return -1;
      if (b.currentStatus === "Overdue" && a.currentStatus !== "Overdue") return 1;
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      return tA - tB;
    });
  }, [medicalEvents, now]);

  const filtered = enrichedEvents.filter((e) => filter === "All" || e.currentStatus === filter);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.patient_id) return;
    
    const patient = patients.find(p => p.id === newEvent.patient_id);
    await addMedicalEvent({
      ...newEvent,
      patient_name: patient?.name || "Unknown Patient"
    });
    setAddOpen(false);
    toast.success("Medical Event Scheduled", { description: `${newEvent.title} scheduled for ${newEvent.time}` });
  };

  const getPriorityColor = (p: Severity) => {
    if (p === "Critical") return "text-red-500 bg-red-500/10 border-red-500/20";
    if (p === "Urgent") return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (p === "Moderate") return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-green-500 bg-green-500/10 border-green-500/20";
  };

  return (
    <AppLayout>
      <TopBar
        title="Smart Alert Center"
        subtitle="Medical Event Scheduling & Real-time Operations"
        actions={
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Schedule Event
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6">
        
        {/* Main Timeline */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {(["All", "Upcoming", "Overdue", "Completed"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-4 py-2 text-xs font-semibold rounded-lg border transition-colors",
                  filter === f ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}>
                {f}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex-1 overflow-y-auto shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Event Timeline
            </h3>
            
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              <AnimatePresence>
                {filtered.map((evt) => (
                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icon */}
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10",
                      evt.currentStatus === "Overdue" ? "bg-red-500 text-white" : evt.currentStatus === "Completed" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                    )}>
                      {evt.currentStatus === "Overdue" ? <AlertTriangle className="w-4 h-4" /> : evt.currentStatus === "Completed" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border", getPriorityColor(evt.priority))}>
                          {evt.priority}
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{evt.time}</span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> {evt.patient_name} <span className="opacity-50">|</span> <Stethoscope className="w-3 h-3"/> {evt.doctor}</p>
                      
                      {evt.currentStatus !== "Completed" && (
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => updateMedicalEventStatus(evt.id, "Completed")} className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors">
                            Mark Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-10 relative z-10 bg-card">No events found for this filter.</div>}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Analytics */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Event Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <span className="text-xs font-medium text-red-600">Overdue Events</span>
                <span className="text-lg font-bold text-red-600">{enrichedEvents.filter(e => e.currentStatus === "Overdue").length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border border-primary/20 bg-primary/5">
                <span className="text-xs font-medium text-primary">Upcoming Today</span>
                <span className="text-lg font-bold text-primary">{enrichedEvents.filter(e => e.currentStatus === "Upcoming").length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <span className="text-xs font-medium text-green-600">Completed</span>
                <span className="text-lg font-bold text-green-600">{enrichedEvents.filter(e => e.currentStatus === "Completed").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Schedule Medical Event</h2>
              <button onClick={() => setAddOpen(false)} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title / Description</label>
                <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Discharge Assessment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Time</label>
                  <input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Patient</label>
                <select required value={newEvent.patient_id} onChange={e => setNewEvent({...newEvent, patient_id: e.target.value})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="" disabled>Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
                  <select required value={newEvent.priority} onChange={e => setNewEvent({...newEvent, priority: e.target.value as Severity})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Stable">Stable / Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Event Type</label>
                  <select required value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full text-sm px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Surgery</option>
                    <option>Expected Discharge</option>
                    <option>ICU Review</option>
                    <option>Medicine Reminder</option>
                    <option>Vitals Check</option>
                    <option>Follow-up</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted text-foreground">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Schedule Event</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
