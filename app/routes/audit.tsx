import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAudit } from "~/lib/crimichain.functions";
import { AppHeader } from "~/components/AppHeader";
import { ExternalLink, Shield, CheckCircle, AlertCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit Trail – CrimiChain" }] }),
  component: AuditPage,
});

const ACTION_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  REPORT_CREATED:       { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  REPORT_ASSIGNED:      { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  INVESTIGATION_STARTED:{ bg: "#fefce8", color: "#92400e", border: "#fde68a" },
  CASE_CLOSED:          { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  CASE_REOPENED:        { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  DIAGNOSTICS_TEST:     { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

function AuditPage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => listAudit({}),
    refetchInterval: 10_000,
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <AppHeader />
      <div style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="cc-container">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-1)", marginBottom: 6 }}>Audit Trail</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-3)" }}>
              Semua aktivitas sistem tercatat permanen — {entries.length} entri terdaftar
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Entri", value: entries.length, icon: <Clock size={16} color="#2563eb" /> },
              { label: "Dianchor",    value: entries.filter((e: any) => e.anchored).length, icon: <CheckCircle size={16} color="#15803d" /> },
              { label: "Gagal Anchor",value: entries.filter((e: any) => e.anchor_error).length, icon: <AlertCircle size={16} color="#dc2626" /> },
              { label: "Unik Laporan",value: new Set(entries.map((e: any) => e.report_id)).size, icon: <Shield size={16} color="#7c3aed" /> },
            ].map(s => (
              <div key={s.label} className="cc-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                {s.icon}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-1)", lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-4)", marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="cc-card" style={{ overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-4)" }}>Memuat data audit...</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: 56, textAlign: "center" }}>
                <Shield size={40} color="var(--color-border-2)" style={{ marginBottom: 12 }} />
                <p style={{ fontWeight: 600, color: "var(--color-text-2)" }}>Belum ada entri audit</p>
                <p style={{ fontSize: 13, color: "var(--color-text-4)", marginTop: 4 }}>Entri akan muncul setelah laporan pertama dibuat</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>No. Laporan</th>
                      <th>Aktor</th>
                      <th>Aksi</th>
                      <th>Detail</th>
                      <th>Blockchain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e: any) => {
                      const ac = ACTION_COLORS[e.action] || { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
                      return (
                        <tr key={e.id}>
                          <td style={{ whiteSpace: "nowrap", color: "var(--color-text-4)", fontSize: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Clock size={11} />
                              {format(new Date(e.ts), "dd MMM, HH:mm", { locale: idLocale })}
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize: 11.5, background: "var(--color-surface-3)", padding: "3px 8px", borderRadius: 5, color: "var(--color-blue)", fontWeight: 700, border: "1px solid var(--color-border)" }}>{e.report_id}</code>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                              <User size={12} color="var(--color-text-4)" />
                              {e.actor}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: ac.bg, color: ac.color, border: `1px solid ${ac.border}` }}>
                              {e.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-3)" }} title={e.detail}>
                            {e.detail}
                          </td>
                          <td>
                            {e.anchored && e.signature ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle size={12} color="#15803d" />
                                  <code style={{ fontSize: 11, color: "var(--color-text-4)" }}>{e.signature.slice(0, 8)}…{e.signature.slice(-5)}</code>
                                </div>
                                {e.explorer_url && (
                                  <a href={e.explorer_url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--color-blue)", textDecoration: "none" }}>
                                    <ExternalLink size={10} /> Explorer
                                  </a>
                                )}
                              </div>
                            ) : e.anchor_error ? (
                              <span style={{ fontSize: 11, color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertCircle size={11} /> Gagal
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-text-4)", fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
