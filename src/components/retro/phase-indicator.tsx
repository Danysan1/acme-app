"use client";

type Phase = "waiting" | "collecting" | "discussing" | "actions" | "closed";

const PHASES: { key: Phase; label: string }[] = [
  { key: "waiting", label: "Waiting" },
  { key: "collecting", label: "Collect" },
  { key: "discussing", label: "Discuss" },
  { key: "actions", label: "Actions" },
];

const phaseOrder: Record<Phase, number> = {
  waiting: 0,
  collecting: 1,
  discussing: 2,
  actions: 3,
  closed: 4,
};

export function PhaseIndicator({ status }: { status: Phase }) {
  const current = phaseOrder[status];

  return (
    <div className="hidden sm:flex items-center gap-1">
      {PHASES.map((phase, i) => {
        const done = phaseOrder[phase.key] < current;
        const active = phase.key === status;

        return (
          <div key={phase.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="w-6 h-px"
                style={{
                  background:
                    done || active ? "#822E7B" : "rgba(255,255,255,0.15)",
                }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all"
                style={{
                  background: active
                    ? "#822E7B"
                    : done
                      ? "#5E2460"
                      : "rgba(255,255,255,0.08)",
                  color: active || done ? "white" : "rgba(255,255,255,0.3)",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              {active && (
                <span className="text-xs text-white font-medium">
                  {phase.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
