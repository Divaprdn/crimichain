import { useQuery } from "@tanstack/react-query";
import { listAudit } from "~/lib/crimichain.functions";
import { StatusBadge } from "./StatusBadge";
import { ExternalLink, Shield, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface CaseTimelineProps {
  reportId: string;
}

const ACTION_ICONS: Record<string, string> = {
  REPORT_CREATED: "📝",
  REPORT_ASSIGNED: "👮",
  INVESTIGATION_STARTED: "🔍",
  CASE_CLOSED: "🔒",
  CASE_REOPENED: "🔓",
  DIAGNOSTICS_TEST: "🧪",
};

export function CaseTimeline({ reportId }: CaseTimelineProps) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit", reportId],
    queryFn: () => listAudit({ data: { reportId } }),
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return <div className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Memuat timeline...</div>;
  }

  if (entries.length === 0) {
    return <div className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Belum ada riwayat.</div>;
  }

  // Show oldest first
  const sorted = [...entries].reverse();

  return (
    <div className="space-y-0">
      {sorted.map((entry: any, i: number) => (
        <div key={entry.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border-2)", zIndex: 1 }}
            >
              {ACTION_ICONS[entry.action] || "•"}
            </div>
            {i < sorted.length - 1 && (
              <div className="w-px flex-1 my-1" style={{ background: "var(--color-border)", minHeight: "16px" }} />
            )}
          </div>

          {/* Content */}
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                  oleh {entry.actor}
                </span>
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                {format(new Date(entry.ts), "dd MMM yyyy HH:mm", { locale: idLocale })}
              </span>
            </div>

            {entry.detail && (
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {entry.detail}
              </p>
            )}

            {entry.anchored && entry.signature && (
              <div
                className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}
              >
                <Shield size={11} style={{ color: "var(--color-accent-cyan)" }} />
                <span className="font-mono" style={{ color: "var(--color-text-muted)" }}>
                  {entry.signature.slice(0, 10)}…{entry.signature.slice(-8)}
                </span>
                {entry.explorer_url && (
                  <a
                    href={entry.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 ml-auto"
                    style={{ color: "var(--color-accent-cyan)" }}
                  >
                    <ExternalLink size={10} />
                    Explorer
                  </a>
                )}
              </div>
            )}

            {entry.anchor_error && (
              <div className="text-xs mt-1" style={{ color: "#f43f5e" }}>
                ✗ Anchor gagal: {entry.anchor_error}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
