import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listReports, updateReportStage, recordAuditEvent } from "~/lib/crimichain.functions";
import { anchorHashOnDevnet } from "~/lib/solana.functions";
import { useCurrentUser } from "~/lib/crimichain-store";
import { StatusBadge } from "./StatusBadge";
import { CaseTimeline } from "./CaseTimeline";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import {
  Shield, UserCheck, Search, CheckCircle, ChevronDown,
  ChevronUp, Inbox, Loader2, ExternalLink, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const TABS = [
  { key: "submitted,reopened",      label: "Antrian",          icon: Inbox },
  { key: "assigned,investigating",  label: "Sedang Ditangani", icon: Search },
  { key: "closed",                  label: "Selesai",          icon: CheckCircle },
];

const RESOLUTIONS = [
  { value: "solved",       label: "Terselesaikan" },
  { value: "unsolved",     label: "Tidak Terselesaikan" },
  { value: "false_report", label: "Laporan Palsu" },
];

export function PoliceDashboard() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [activeTab, setActiveTab]     = useState("submitted,reopened");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [txDialog, setTxDialog]       = useState<any>(null);
  const [closingId, setClosingId]     = useState<string | null>(null);
  const [resolution, setResolution]   = useState("solved");
  const [summary, setSummary]         = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [anchoring, setAnchoring]     = useState(false);

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ["reports"], queryFn: () => listReports({}), refetchInterval: 10_000,
  });

  const tabStages = activeTab.split(",");
  const reports = allReports.filter((r: any) =>
    activeTab === "closed" ? r.stage === "closed" : tabStages.some(s => r.stage === s)
  );

  const doAnchor = async (action: string, reportId: string) => {
    setAnchoring(true);
    let txData: any = null, anchorError: string | null = null;
    try { txData = await anchorHashOnDevnet({ data: { hash: `${action}:${reportId}:${Date.now()}`, action, reportId } }); }
    catch (err: any) { anchorError = err.message; }
    setAnchoring(false);
    return { txData, anchorError };
  };

  const auditLog = async (report_id: string, action: string, detail: string, tx: any, err: string | null) =>
    recordAuditEvent({ data: { report_id, actor: user!.name, action, detail, signature: tx?.signature, explorer_url: tx?.explorerUrl, payer: tx?.payer, anchored: !!tx?.signature, anchor_error: err || undefined } });

  const handleAssign = async (report: any) => {
    setActionLoading(report.id);
    try {
      const { txData, anchorError } = await doAnchor("REPORT_ASSIGNED", report.id);
      await updateReportStage({ data: { id: report.id, stage: "assigned", assigned_officer: { username: user!.username, name: user!.name, badge: user!.badge } } });
      await auditLog(report.id, "REPORT_ASSIGNED", `Ditugaskan ke ${user!.name} (${user!.badge})`, txData, anchorError);
      await qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (e: any) { alert("Gagal: " + e.message); }
    finally { setActionLoading(null); }
  };

  const handleInvestigate = async (report: any) => {
    setActionLoading(report.id);
    try {
      const { txData, anchorError } = await doAnchor("INVESTIGATION_STARTED", report.id);
      await updateReportStage({ data: { id: report.id, stage: "investigating", investigation_started_at: new Date().toISOString() } });
      await auditLog(report.id, "INVESTIGATION_STARTED", `Investigasi dimulai oleh ${user!.name}`, txData, anchorError);
      await qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (e: any) { alert("Gagal: " + e.message); }
    finally { setActionLoading(null); }
  };

  const handleClose = async (report: any) => {
    if (!summary.trim()) return;
    setActionLoading(report.id);
    try {
      const { txData, anchorError } = await doAnchor("CASE_CLOSED", report.id);
      const closure = { resolution, summary, closed_by: user!.name, closed_at: new Date().toISOString() };
      await updateReportStage({ data: { id: report.id, stage: "closed", closure } });
      await auditLog(report.id, "CASE_CLOSED", `Kasus ditutup: ${resolution} – ${summary}`, txData, anchorError);
      setClosingId(null); setSummary("");
      await qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (e: any) { alert("Gagal: " + e.message); }
    finally { setActionLoading(null); }
  };

  const handleReopen = async (report: any) => {
    setActionLoading(report.id);
    try {
      const { txData, anchorError } = await doAnchor("CASE_REOPENED", report.id);
      await updateReportStage({ data: { id: report.id, stage: "reopened" } });
      await auditLog(report.id, "CASE_REOPENED", `Kasus dibuka kembali oleh ${user!.name}`, txData, anchorError);
      await qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (e: any) { alert("Gagal: " + e.message); }
    finally { setActionLoading(null); }
  };

  // Stats
  const total       = allReports.length;
  const antrian     = allReports.filter((r: any) => r.stage === "submitted" || r.stage === "reopened").length;
  const investigasi = allReports.filter((r: any) => r.stage === "investigating").length;
  const selesai     = allReports.filter((r: any) => r.stage === "closed").length;

  return (
    <div style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="cc-container">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} color="white" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text-1)" }}>Dashboard Petugas</h1>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-4)" }}>{user?.name} · {user?.badge}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Laporan",  value: total,       color: "#2563eb", bg: "#eff6ff" },
            { label: "Antrian",        value: antrian,     color: "#d97706", bg: "#fefce8" },
            { label: "Investigasi",    value: investigasi, color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Selesai",        value: selesai,     color: "#059669", bg: "#f0fdf4" },
          ].map(s => (
            <div key={s.label} className="cc-card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key)} className="btn btn-sm"
                style={{ background: active ? "var(--color-navy)" : "var(--color-surface)", color: active ? "white" : "var(--color-text-3)", border: `1px solid ${active ? "var(--color-navy)" : "var(--color-border)"}` }}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="cc-card" style={{ padding: 48, display: "flex", justifyContent: "center" }}>
            <Loader2 size={24} className="animate-spin" color="var(--color-blue)" />
          </div>
        ) : reports.length === 0 ? (
          <div className="cc-card" style={{ padding: 56, textAlign: "center" }}>
            <Inbox size={40} color="var(--color-border-2)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "var(--color-text-2)" }}>Tidak ada laporan di tab ini</p>
          </div>
        ) : (
          <div className="cc-card" style={{ overflow: "hidden" }}>
            {reports.map((report: any, idx: number) => {
              const expanded = expandedId === report.id;
              const loading  = actionLoading === report.id;
              const closing  = closingId === report.id;

              return (
                <div key={report.id} style={{ borderBottom: idx < reports.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  {/* Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: "pointer", transition: "background 0.15s" }}
                    className="cc-table-row-hover"
                    onClick={() => setExpandedId(expanded ? null : report.id)}>
                    <code style={{ fontSize: 11.5, background: "var(--color-surface-3)", padding: "3px 8px", borderRadius: 5, color: "var(--color-blue)", fontWeight: 700, border: "1px solid var(--color-border)", flexShrink: 0 }}>{report.id}</code>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {report.title || `${report.category} — ${report.location}`}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 2 }}>
                        {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: idLocale })}
                        {report.assigned_officer && <span> · <UserCheck size={10} style={{ display: "inline" }} /> {report.assigned_officer.name}</span>}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <StatusBadge stage={report.stage} resolution={report.closure?.resolution} />
                      {report.explorer_url && (
                        <a href={report.explorer_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ padding: "4px 7px", borderRadius: 6, background: "var(--color-blue-light)", color: "var(--color-blue)", border: "1px solid #bfdbfe", display: "inline-flex" }}>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {expanded ? <ChevronUp size={15} color="var(--color-text-4)" /> : <ChevronDown size={15} color="var(--color-text-4)" />}
                    </div>
                  </div>

                  {/* Expanded */}
                  {expanded && (
                    <div style={{ padding: "16px 20px 20px", background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-4)", marginBottom: 6 }}>Kronologi / Deskripsi</p>
                          <p style={{ fontSize: 13.5, color: "var(--color-text-2)", lineHeight: 1.65 }}>{report.chronology || report.description || "—"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-4)", marginBottom: 10 }}>Timeline Kasus</p>
                          <CaseTimeline reportId={report.id} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                        {(report.stage === "submitted" || report.stage === "reopened") && (
                          <button onClick={() => handleAssign(report)} disabled={loading || anchoring} className="btn btn-primary">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Tugaskan ke Saya
                          </button>
                        )}
                        {report.stage === "assigned" && (
                          <button onClick={() => handleInvestigate(report)} disabled={loading || anchoring} className="btn btn-blue">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Mulai Investigasi
                          </button>
                        )}
                        {report.stage === "investigating" && (
                          closing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 440 }}>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>Resolusi</label>
                                <select className="cc-input" value={resolution} onChange={e => setResolution(e.target.value)}>
                                  {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>Ringkasan Penanganan</label>
                                <textarea className="cc-input" style={{ resize: "none" }} rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Deskripsikan hasil penanganan..." />
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleClose(report)} disabled={loading || !summary.trim()} className="btn btn-primary">
                                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Tutup Kasus
                                </button>
                                <button onClick={() => setClosingId(null)} className="btn btn-ghost">Batal</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setClosingId(report.id)} className="btn btn-primary">
                              <CheckCircle size={14} /> Tutup Kasus
                            </button>
                          )
                        )}
                        {report.stage === "closed" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {report.closure && (
                              <div style={{ padding: "12px 16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac" }}>
                                <p style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 4 }}>
                                  Resolusi: {RESOLUTIONS.find(r => r.value === report.closure.resolution)?.label}
                                </p>
                                <p style={{ fontSize: 13, color: "#166534" }}>{report.closure.summary}</p>
                                <p style={{ fontSize: 11, color: "#4ade80", marginTop: 6 }}>
                                  Ditutup oleh {report.closure.closed_by} · {format(new Date(report.closure.closed_at), "d MMM yyyy", { locale: idLocale })}
                                </p>
                              </div>
                            )}
                            <button onClick={() => handleReopen(report)} disabled={loading} className="btn btn-ghost btn-sm" style={{ width: "fit-content" }}>
                              {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Buka Kembali
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Anchoring toast */}
      {anchoring && (
        <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 12, background: "var(--color-navy)", color: "white", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgb(0 0 0 / 0.2)", zIndex: 100 }}>
          <Loader2 size={15} className="animate-spin" /> Menganchor ke Solana...
        </div>
      )}

      {txDialog && <TransactionDetailDialog report={txDialog} onClose={() => setTxDialog(null)} />}

      <style>{`
        .cc-table-row-hover:hover { background: var(--color-surface-2); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
