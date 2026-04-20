import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type Viewport = "desktop" | "mobile";

export function ViewportToggle({
  value,
  onChange,
}: {
  value: Viewport;
  onChange: (v: Viewport) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={cn(
          "inline-flex h-7 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors",
          value === "desktop" && "bg-muted text-foreground",
        )}
        aria-label="Desktop"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={cn(
          "inline-flex h-7 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors",
          value === "mobile" && "bg-muted text-foreground",
        )}
        aria-label="Mobile"
      >
        <Smartphone className="h-4 w-4" />
      </button>
    </div>
  );
}
