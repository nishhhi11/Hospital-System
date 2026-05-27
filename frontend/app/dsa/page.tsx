"use client";
import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useERStore, SEVERITY_ORDER } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { cn } from "@/lib/utils";
import {
  GitBranch, ArrowDown, RotateCcw, Play, Layers,
  Search, SortAsc, GitMerge, Network, Undo2,
} from "lucide-react";

type DSAMode = "priority-queue" | "avl-tree" | "merge-sort" | "binary-search" | "dfs" | "greedy" | "stack";

const MODES: { key: DSAMode; label: string; icon: typeof GitBranch; desc: string }[] = [
  { key: "priority-queue", label: "Live Triage Queue", icon: Layers, desc: "Max-heap representation of real-time patient priority scores" },
  { key: "avl-tree", label: "Registry Index State", icon: GitBranch, desc: "Self-balancing structural index for O(log n) patient retrieval" },
  { key: "merge-sort", label: "Queue Re-Sort Engine", icon: GitMerge, desc: "Divide-and-conquer processing for priority recalibration" },
  { key: "binary-search", label: "Fast Search Index", icon: Search, desc: "O(log n) active search state for patient ID lookups" },
  { key: "dfs", label: "Routing Path Analyzer", icon: Network, desc: "Depth-first mapping of real-time department accessibility" },
  { key: "greedy", label: "Allocation Optimizer", icon: SortAsc, desc: "Greedy heuristic processing for critical bed assignments" },
  { key: "stack", label: "Reprioritization Log", icon: Undo2, desc: "LIFO state stack tracking clinical severity modifications" },
];

import { motion } from "framer-motion";

// Priority Queue visualization
function PriorityQueueViz() {
  const { patients } = useERStore();
  const heap = patients.filter((p) => p.status !== "Discharged");

  if (heap.length === 0) {
    return <div className="text-center py-20 text-muted-foreground italic">No patients in triage heap</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <p className="text-xs text-muted-foreground text-center mb-6">
        Binary Max-Heap representation of the priority queue. The root (Index 0) always contains the highest priority patient.
      </p>
      
      <div className="flex flex-col gap-12">
        {[0, 1, 2, 3].map((level) => {
          const start = Math.pow(2, level) - 1;
          const end = Math.pow(2, level + 1) - 1;
          const levelItems = heap.slice(start, Math.min(end, heap.length));
          
          if (levelItems.length === 0) return null;
          
          return (
            <div key={level} className="flex flex-col items-center">
              <div className="flex items-center gap-6 justify-center flex-wrap">
                {levelItems.map((p, i) => {
                  const globalIndex = start + i;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      key={p.id} 
                      className={cn(
                        "relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-all shadow-sm w-32",
                        globalIndex === 0 
                          ? "border-primary bg-primary/10 ring-4 ring-primary/5" 
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <span className="absolute -top-2 left-2 text-[8px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-mono border border-border">
                        #{globalIndex}
                      </span>
                      {globalIndex === 0 && (
                        <span className="absolute -top-2.5 right-2 text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-lg uppercase tracking-tighter">
                          Critical
                        </span>
                      )}
                      <div className="text-xs font-bold text-foreground truncate w-full">{p.name.split(" ")[0]}</div>
                      <SeverityBadge severity={p.severity} size="xs" />
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">{p.id}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {heap.length > 15 && (
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-4 py-2 bg-muted/50 rounded-full border border-border">
            <ArrowDown className="w-3.5 h-3.5" /> {heap.length - 15} additional nodes in operational heap
          </div>
        </div>
      )}
    </div>
  );
}

// AVL Tree visualization
function AVLTreeViz() {
  const { avlTree } = useERStore();

  const Node = ({ n, level }: { n: any, level: number }) => {
    if (!n) return null;
    return (
      <div className="flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-center min-w-[110px] shadow-sm transition-all relative z-10",
            level === 0 ? "border-primary bg-primary/10 ring-4 ring-primary/5 scale-110" : "border-border bg-card"
          )}
        >
          <div className="text-xs font-black font-mono text-foreground uppercase tracking-widest">{n.id}</div>
          <div className="text-[10px] text-muted-foreground truncate w-full max-w-[90px] font-medium">{n.name}</div>
          <SeverityBadge severity={n.severity as any} size="xs" />
          <div className="absolute -bottom-2 -right-1 text-[8px] bg-muted border border-border text-muted-foreground px-1 py-0.5 rounded font-mono font-bold">
            H:{n.height}
          </div>
        </motion.div>
        
        {(n.left || n.right) && (
          <div className="relative flex gap-12 mt-12">
            {/* SVG connectors */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full h-12 pointer-events-none">
               <svg className="w-full h-full" style={{ minWidth: "140px" }}>
                 {n.left && <line x1="50%" y1="0" x2="25%" y2="100%" stroke="currentColor" className="text-border" strokeWidth="1.5" strokeDasharray="4 2" />}
                 {n.right && <line x1="50%" y1="0" x2="75%" y2="100%" stroke="currentColor" className="text-border" strokeWidth="1.5" strokeDasharray="4 2" />}
               </svg>
            </div>
            
            <div className="flex-1 flex justify-center min-w-[120px]">
              <Node n={n.left} level={level + 1} />
            </div>
            <div className="flex-1 flex justify-center min-w-[120px]">
              <Node n={n.right} level={level + 1} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!avlTree) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <GitBranch className="w-12 h-12 opacity-20 mb-4" />
        <p className="italic text-sm font-medium">Initializing C++ AVL Index Engine...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-20 pt-4">
      <div className="flex justify-center min-w-max p-4">
        <Node n={avlTree} level={0} />
      </div>
    </div>
  );
}


// Merge Sort visualization
function MergeSortViz() {
  const { patients } = useERStore();
  const items = [...patients]
    .filter((p) => p.status !== "Discharged")
    .map((p) => ({ id: p.id, name: p.name.split(" ")[0], sev: SEVERITY_ORDER[p.severity] }))
    .slice(0, 8);

  const sorted = [...items].sort((a, b) => a.sev - b.sev);
  const half = Math.floor(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);
  const leftSorted = left.sort((a, b) => a.sev - b.sev);
  const rightSorted = right.sort((a, b) => a.sev - b.sev);

  const SevColor = ["bg-red-500", "bg-orange-500", "bg-blue-500", "bg-green-500"];
  const SevLabel = ["C", "U", "M", "S"];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Divide-and-conquer: split queue into halves, sort each recursively, then merge back in O(n log n).
      </p>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Unsorted Input</div>
        <div className="flex gap-1.5 flex-wrap">
          {items.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1 px-2 py-1.5 bg-card border border-border rounded-lg">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", SevColor[p.sev])}>
                {SevLabel[p.sev]}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Left Half</div>
          <div className="flex gap-1.5 flex-wrap">
            {left.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", SevColor[p.sev])}>
                  {SevLabel[p.sev]}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Right Half</div>
          <div className="flex gap-1.5 flex-wrap">
            {right.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", SevColor[p.sev])}>
                  {SevLabel[p.sev]}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Merged & Sorted Output</div>
        <div className="flex gap-1.5 flex-wrap">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex flex-col items-center gap-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-[10px] text-green-600 font-bold">{i + 1}</span>
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", SevColor[p.sev])}>
                {SevLabel[p.sev]}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Binary Search
function BinarySearchViz() {
  const { patients } = useERStore();
  const sorted = [...patients].sort((a, b) => a.id.localeCompare(b.id));
  const [target, setTarget] = useState(sorted[0]?.id ?? "");
  const [step, setStep] = useState(-1);
  const [steps, setSteps] = useState<{ lo: number; hi: number; mid: number; found: boolean }[]>([]);

  const runSearch = () => {
    const arr = sorted.map((p) => p.id);
    let lo = 0, hi = arr.length - 1;
    const newSteps: typeof steps = [];
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const found = arr[mid] === target;
      newSteps.push({ lo, hi, mid, found });
      if (found) break;
      if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    setSteps(newSteps);
    setStep(0);
  };

  const current = steps[step];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Binary search on sorted patient ID array. O(log n) lookup – halves the search space each iteration.
      </p>
      <div className="flex items-center gap-3">
        <select value={target} onChange={(e) => { setTarget(e.target.value); setSteps([]); setStep(-1); }}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          {sorted.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <button onClick={runSearch}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Play className="w-3.5 h-3.5" /> Search
        </button>
        {steps.length > 0 && step < steps.length - 1 && (
          <button onClick={() => setStep(s => s + 1)}
            className="px-3 py-2 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors">
            Next step
          </button>
        )}
      </div>

      {steps.length > 0 && current && (
        <div>
          <div className="text-xs text-muted-foreground mb-3">
            Step {step + 1}/{steps.length} — lo={current.lo}, hi={current.hi}, mid={current.mid}
            {current.found ? " → FOUND!" : ""}
          </div>
          <div className="flex gap-1 flex-wrap">
            {sorted.map((p, i) => (
              <div key={p.id} className={cn("px-2 py-1.5 rounded-lg border text-xs font-mono text-center transition-all",
                i === current.mid && current.found ? "bg-green-100 border-green-400 text-green-700 font-bold scale-110" :
                i === current.mid ? "bg-primary/20 border-primary text-primary font-bold scale-105" :
                i >= current.lo && i <= current.hi ? "bg-muted border-border text-foreground" :
                "bg-card border-border text-muted-foreground opacity-30"
              )}>
                {p.id}
              </div>
            ))}
          </div>
          {steps[steps.length - 1]?.found === false && step === steps.length - 1 && (
            <p className="text-xs text-red-600 mt-2">Target not found in array.</p>
          )}
        </div>
      )}
    </div>
  );
}

// DFS Graph
function DFSViz() {
  const NODES = [
    { id: "Triage", x: 250, y: 40 },
    { id: "Trauma Bay", x: 100, y: 130 },
    { id: "ICU", x: 250, y: 130 },
    { id: "Radiology", x: 400, y: 130 },
    { id: "General Ward", x: 100, y: 220 },
    { id: "Observation", x: 250, y: 220 },
    { id: "Discharge", x: 400, y: 220 },
    { id: "Surgery", x: 175, y: 310 },
  ];
  const EDGES: [string, string][] = [
    ["Triage", "Trauma Bay"], ["Triage", "ICU"], ["Triage", "Radiology"],
    ["Trauma Bay", "General Ward"], ["Trauma Bay", "Surgery"],
    ["ICU", "Observation"], ["Radiology", "Discharge"],
    ["General Ward", "Surgery"], ["Observation", "Discharge"],
  ];
  const [visited, setVisited] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const runDFS = async () => {
    setRunning(true);
    setVisited([]);
    const adj: Record<string, string[]> = {};
    NODES.forEach((n) => (adj[n.id] = []));
    EDGES.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const visitedSet = new Set<string>();
    const result: string[] = [];
    const dfs = async (node: string) => {
      if (visitedSet.has(node)) return;
      visitedSet.add(node);
      result.push(node);
      setVisited([...result]);
      await new Promise((r) => setTimeout(r, 600));
      for (const neighbor of adj[node]) {
        await dfs(neighbor);
      }
    };
    await dfs("Triage");
    setRunning(false);
  };

  const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        DFS traversal of the hospital routing graph. Starting from Triage, visits all reachable departments.
      </p>
      <button onClick={runDFS} disabled={running}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
        <Play className="w-3.5 h-3.5" /> {running ? "Running..." : "Run DFS"}
      </button>
      <div className="relative bg-card border border-border rounded-xl overflow-hidden" style={{ height: 360 }}>
        <svg width="100%" height="100%" viewBox="0 0 500 360">
          {EDGES.map(([a, b], i) => {
            const na = nodeById(a), nb = nodeById(b);
            return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--color-border)" strokeWidth={2} />;
          })}
          {NODES.map((n) => {
            const isVisited = visited.includes(n.id);
            const isCurrent = visited[visited.length - 1] === n.id;
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={28}
                  fill={isCurrent ? "oklch(0.52 0.19 255)" : isVisited ? "oklch(0.85 0.1 255)" : "var(--color-card)"}
                  stroke={isCurrent ? "oklch(0.52 0.19 255)" : isVisited ? "oklch(0.52 0.19 255)" : "var(--color-border)"}
                  strokeWidth={2} />
                <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fontWeight={600}
                  fill={isCurrent || isVisited ? "white" : "var(--color-foreground)"}>
                  {n.id.split(" ").map((w, i) => (
                    <tspan key={i} x={n.x} dy={i === 0 && n.id.includes(" ") ? -5 : i > 0 ? 11 : 0}>{w}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {visited.length > 0 && (
        <div className="text-xs text-muted-foreground">
          DFS Order: {visited.map((v, i) => (
            <span key={v} className="font-medium text-primary">{v}{i < visited.length - 1 ? " → " : ""}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Greedy Bed Allocation
function GreedyViz() {
  const { patients, beds } = useERStore();
  const criticalPatients = [...patients]
    .filter((p) => p.status !== "Discharged" && !p.assigned_bed)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 5);
  const availableBeds = beds.filter((b) => b.status === "Available").slice(0, 5);

  const BED_SCORE: Record<string, number> = { Trauma: 100, ICU: 90, Observation: 60, General: 40 };
  const SEV_NEED: Record<string, string> = { Critical: "Trauma", Urgent: "ICU", Moderate: "General", Stable: "Observation" };

  const assignments: { patient: string; bed: string; bedType: string; optimal: boolean }[] = [];
  const usedBeds = new Set<string>();
  criticalPatients.forEach((p) => {
    const ideal = availableBeds.find((b) => !usedBeds.has(b.id) && b.type === SEV_NEED[p.severity]);
    const fallback = availableBeds.find((b) => !usedBeds.has(b.id));
    const chosen = ideal ?? fallback;
    if (chosen) {
      usedBeds.add(chosen.id);
      assignments.push({ patient: p.name, bed: chosen.id, bedType: chosen.type, optimal: !!ideal });
    }
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Greedy assignment: for each unassigned patient (ordered by severity), allocate the most appropriate available bed type.
      </p>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">All unassigned patients already have beds, or no available beds remain.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a, i) => (
            <div key={i} className={cn("flex items-center gap-4 p-3.5 rounded-xl border",
              a.optimal ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
            )}>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-border text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{a.patient}</div>
                <div className={cn("text-xs", a.optimal ? "text-green-700" : "text-orange-700")}>
                  {a.optimal ? "Optimal match" : "Suboptimal (best available)"} → {a.bed} ({a.bedType})
                </div>
              </div>
              <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", a.optimal ? "bg-green-600 text-white" : "bg-orange-500 text-white")}>
                {a.optimal ? "Optimal" : "Fallback"}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Greedy does not guarantee globally optimal, but achieves O(n) time — suitable for real-time ER constraints.
      </p>
    </div>
  );
}

import { toast } from "sonner";

// Stack Undo
function StackViz() {
  const { undoAction, patients } = useERStore();
  const [stack, setStack] = useState<{ type: string; patient: string; old_val: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/dsa/stack")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStack(data.reverse()); // Reverse so Top is index 0
      })
      .catch(console.error);
  }, [patients]); // Refetch when global state changes

  const pop = async () => {
    if (stack.length === 0) return;
    setLoading(true);
    try {
      const res = await undoAction();
      toast.success("Action Undone", {
        description: `Successfully reverted ${res.restored_action} for ${res.patient}.`,
      });
    } catch (e: any) {
      toast.error("Undo Failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        LIFO stack tracking all destructive clinical actions. The C++ engine maintains this persistent operational history.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={pop} disabled={stack.length === 0 || loading}
          className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 shadow-sm">
          {loading ? "Reverting..." : "Undo Last Action"}
        </button>
      </div>
      <div className="mt-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Operational History Stack (top → bottom)</div>
        {stack.length === 0 ? (
          <div className="flex items-center justify-center h-20 bg-muted rounded-xl text-xs text-muted-foreground border border-border border-dashed">Stack is empty</div>
        ) : (
          <div className="space-y-1.5">
            {stack.map((item, i) => (
              <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={i + item.patient + item.type} 
                className={cn("flex items-center gap-4 px-4 py-2.5 rounded-lg border",
                i === 0 ? "bg-primary/10 border-primary shadow-sm" : "bg-card border-border"
              )}>
                {i === 0 && <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded uppercase">TOP</span>}
                <div className="flex-1 text-sm text-foreground font-medium">{item.patient}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground uppercase">{item.type}</span>
                  {item.old_val !== "none" && ` (Previous: ${item.old_val})`}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const VIZ_COMPONENTS: Record<DSAMode, React.FC> = {
  "priority-queue": PriorityQueueViz,
  "avl-tree": AVLTreeViz,
  "merge-sort": MergeSortViz,
  "binary-search": BinarySearchViz,
  "dfs": DFSViz,
  "greedy": GreedyViz,
  "stack": StackViz,
};

export default function DSAPage() {
  const [mode, setMode] = useState<DSAMode>("priority-queue");
  const ActiveViz = VIZ_COMPONENTS[mode];
  const activeMeta = MODES.find((m) => m.key === mode)!;

  return (
    <AppLayout>
      <TopBar title="System Logic Monitor" subtitle="Real-time algorithmic state, routing paths, and triage queues" />
      <div className="flex-1 overflow-hidden flex">
        {/* Mode selector */}
        <div className="w-56 shrink-0 border-r border-border overflow-y-auto p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Algorithms</p>
          <div className="space-y-0.5">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setMode(key)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                  mode === key ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
              <div className="p-2 bg-primary/10 rounded-lg">
                <activeMeta.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{activeMeta.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{activeMeta.desc}</p>
              </div>
            </div>
            <ActiveViz />
          </div>
          
          {/* Real-time System Logic Feed */}
          <div className="w-full xl:w-80 shrink-0 bg-card border border-border rounded-xl p-4 flex flex-col h-fit max-h-full overflow-hidden">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-4">System Activity Feed</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              <SystemActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SystemActivityFeed() {
  const { patients, alerts } = useERStore();
  const [history, setHistory] = useState<{ time: string; event: string; target: string; algo: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/dsa/stack")
      .then(res => res.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        
        // Map backend operations to enterprise system events
        const mapped = data.reverse().map(item => {
          let event = "Operation Executed";
          let algo = "O(1) Hash Map";
          
          if (item.type === "ADD") { event = "Patient Registered"; algo = "AVL Insert / Heap Push"; }
          if (item.type === "DELETE") { event = "Patient Discharged"; algo = "AVL Delete / Heap Rebuild"; }
          if (item.type === "UPDATE_SEVERITY") { event = "Queue Reprioritized"; algo = "Max-Heapify (O(log n))"; }
          if (item.type === "ASSIGN_BED") { event = "Bed Assigned"; algo = "Greedy Allocation"; }
          if (item.type === "DISCHARGE_BED") { event = "Bed Freed"; algo = "O(1) Status Update"; }

          return {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // using current time as approximation since undo.db doesn't store time
            event,
            target: item.patient,
            algo
          };
        });

        // Mix in recent active alerts
        const activeAlerts = alerts.slice(0, 3).map(a => ({
          time: a.time,
          event: a.category === "Code" ? "Critical Patient Detected" : "System Alert",
          target: a.message.replace("Critical Patient: ", ""),
          algo: "Condition Polling"
        }));

        setHistory([...mapped, ...activeAlerts].slice(0, 10)); // keep top 10
      });
  }, [patients, alerts]);

  if (history.length === 0) return <div className="text-xs text-muted-foreground text-center py-10">Waiting for system events...</div>;

  return (
    <>
      {history.map((h, i) => (
        <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i + h.event + h.target} 
          className="p-3 rounded-lg border border-border bg-background relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-primary">{h.event}</span>
            <span className="text-[10px] text-muted-foreground">{h.time}</span>
          </div>
          <p className="text-xs text-foreground font-medium truncate">{h.target}</p>
          <div className="mt-2 text-[9px] text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded font-mono">
            {h.algo}
          </div>
        </motion.div>
      ))}
    </>
  );
}
