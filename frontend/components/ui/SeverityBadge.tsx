import { Severity } from "@/lib/store";
import { severityConfig } from "@/lib/severity";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity, size = "sm" }: { severity: Severity; size?: "xs" | "sm" }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        cfg.bg, cfg.text, cfg.border,
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
