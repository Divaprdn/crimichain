import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listReports, createReport, recordAuditEvent, updateReportStage } from "~/lib/crimichain.functions";
import { anchorHashOnDevnet } from "~/lib/solana.functions";
import { sha256 } from "~/lib/crimichain-store";
import { StatusBadge } from "./StatusBadge";
import { CaseTimeline } from "./CaseTimeline";
import { EncryptionAnimation } from "./EncryptionAnimation";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import {
  Shield, Plus, ChevronDown, ChevronUp, ExternalLink,
  RotateCcw, FileText, Search, CreditCard, CheckCircle,
  Lock, Blocks, X, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const CATEGORIES = [
  { value: "pencurian", label: "Pencurian" },
  { value: "penipuan",  label: "Penipuan" },
  { value: "kekerasan", label: "Kekerasan" },
  { value: "narkoba",   label: "Narkoba" },
  { value: "lainnya",   label: "Lainnya" },
];

export function CitizenDashboard() {
  const qc = useQueryClient();
  const [showForm, setShowForm]           = useState(false);
  const [anchoring, setAnchoring]         = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [txDialogReport, setTxDialogReport] = useState<any>(null);
  const [reopenId, setReopenId]           = useState<string | null>(null);
  const [reopenReason, setReopenReason]   = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [successId, setSuccessId]         = useState<string | null>(null);
  const [nikSearch, setNikSearch]         = useState("");
  const [nikFilter, setNikFilter]         = useState("");

  const [form, setForm] = useState({
    name: "", nik: "", phone: "", title: "",
    category: "pencurian" as any, chronology: "", attachment_name: "",
  });

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => listReports({}),
    refetchInterval: 15_000,
  });

  const reports = nikFilter
    ? allReports.filter((r: any) => r.reporter_nik === nikFilter)
    : allReports;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = JSON.stringify({ ...form, ts: new Date().toISOString() });
      const hash = await sha256(payload);
      setAnchoring(true);
      let txData: any = null, anchorError: string | null = null;
      try { txData = await anchorHashOnDevnet({ data: { hash, action: "REPORT_CREATED", reportId: "PENDING" } }); }
      catch (err: any) { anchorError = err.message; }
      setAnchoring(false);
      const report = await createReport({
        data: { title: form.title, category: form.category, chronology: form.chronology,
          attachment_name: form.attachment_name || undefined, hash,
          tx_id: txData?.signature, explorer_url: txData?.explorerUrl,
          reporter: form.name, reporter_nik: form.nik, reporter_phone: form.phone },
      });
      await recordAuditEvent({ data: {
        report_id: report.id, actor: form.name, action: "REPORT_CREATED",
        detail: `Laporan baru: ${form.title}`, signature: txData?.signature,
        explorer_url: txData?.explorerUrl, payer: txData?.payer, memo: hash,
        anchored: !!txData?.signature, anchor_error: anchorError || undefined,
      }});
      await qc.invalidateQueries({ queryKey: ["reports"] });
      setSuccessId(report.id);
      setShowForm(false);
      setForm({ name: "", nik: "", phone: "", title: "", category: "pencurian", chronology: "", attachment_name: "" });
    } catch (err: any) { alert("Gagal: " + err.message); }
    finally { setSubmitting(false); setAnchoring(false); }
  };

  const handleReopen = async (reportId: string) => {
    if (!reopenReason.trim()) return;
    try {
      await updateReportStage({ data: { id: reportId, stage: "reopened", reopen: { reason: reopenReason, ts: new Date().toISOString() } } });
      await recordAuditEvent({ data: { report_id: reportId, actor: "Pelapor", action: "CASE_REOPENED", detail: `Dibuka kembali: ${reopenReason}`, anchored: false } });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      setReopenId(null); setReopenReason("");
    } catch (err: any) { alert("Gagal: " + err.message); }
  };

  return (
    <div style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="cc-container" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Hero ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-blue-light)", color: "var(--color-blue)", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 99, marginBottom: 14, border: "1px solid #bfdbfe" }}>
              <Blocks size={13} /> Powered by Solana Blockchain
            </div>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "var(--color-text-1)", lineHeight: 1.25, marginBottom: 12 }}>
              Layanan Pelaporan Warga
            </h1>
            <p style={{ fontSize: 15, color: "var(--color-text-3)", lineHeight: 1.7, maxWidth: 500 }}>
              Setiap laporan dan perkembangannya direkam pada <strong style={{ color: "var(--color-text-2)" }}>Solana Devnet</strong> sehingga seluruh perjalanan kasus dapat diverifikasi secara publik dan transparan.
            </p>
          </div>
          <button onClick={() => { setShowForm(v => !v); }} className="btn btn-primary btn-lg" style={{ flexShrink: 0 }}>
            <Plus size={18} /> Buat Laporan Baru
          </button>
        </div>

        {/* ── Success banner ──────────────────────────────────── */}
        {successId && (
          <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac" }}>
            <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, color: "#15803d", fontSize: 14 }}>Laporan berhasil dikirim: {successId}</span>
              <span style={{ fontSize: 13, color: "#4ade80", marginLeft: 10 }}>Hash & tanda tangan Solana telah disimpan</span>
            </div>
            <button onClick={() => setSuccessId(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#86efac", lineHeight: 1 }}><X size={18} /></button>
          </div>
        )}

        {/* ── Info cards row ──────────────────────────────────── */}
        {!showForm && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <InfoCard icon={<Shield size={20} color="white" />} iconBg="var(--color-navy)"
              title="Audit Trail Real-time"
              desc="Dari pembuatan laporan hingga kasus selesai — semua tercatat permanen di blockchain dan tidak dapat dimanipulasi." />
            <InfoCard icon={<Lock size={20} color="white" />} iconBg="#2563eb"
              title="Terenkripsi & Terverifikasi"
              desc="Setiap data laporan di-hash dengan SHA-256 dan di-anchor ke Solana Devnet sebagai bukti integritas yang dapat diaudit." />
            <InfoCard icon={<CheckCircle size={20} color="white" />} iconBg="#059669"
              title="Transparansi Penuh"
              desc="Status penanganan kasus dapat dipantau secara real-time. Warga bisa memverifikasi sendiri melalui Solana Explorer." />
          </div>
        )}

        {/* ── Form ────────────────────────────────────────────── */}
        {showForm && (
          <div className="cc-card animate-fade-up" style={{ overflow: "hidden" }}>
            {anchoring ? <EncryptionAnimation /> : (
              <form onSubmit={handleSubmit}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={17} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-1)" }}>Form Laporan Kejahatan</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>Data akan dienkripsi dan dianchor ke Solana Devnet</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-4)", padding: 4 }}><X size={18} /></button>
                </div>

                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                    <Field label="Nama Lengkap" required><input className="cc-input" type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Nama pelapor" required /></Field>
                    <Field label="NIK (16 digit)" required><input className="cc-input" type="text" value={form.nik} onChange={e => setForm(f => ({...f, nik: e.target.value}))} placeholder="3201XXXXXXXXXXXX" maxLength={16} required /></Field>
                    <Field label="Nomor HP" required><input className="cc-input" type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="08xxxxxxxxxx" required /></Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <Field label="Judul Laporan" required><input className="cc-input" type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Ringkasan singkat kejadian" required /></Field>
                    <Field label="Kategori" required>
                      <select className="cc-input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as any}))}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Kronologi Kejadian" required>
                    <textarea className="cc-input" style={{ resize: "none" }} rows={4} value={form.chronology} onChange={e => setForm(f => ({...f, chronology: e.target.value}))} placeholder="Ceritakan secara detail: waktu, lokasi, pelaku, dan kronologi kejadian..." required />
                  </Field>

                  <Field label="Nama File Lampiran (opsional)">
                    <input className="cc-input" type="text" value={form.attachment_name} onChange={e => setForm(f => ({...f, attachment_name: e.target.value}))} placeholder="contoh: bukti_foto.jpg" />
                  </Field>

                  <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                    <button type="submit" disabled={submitting} className="btn btn-primary">
                      <Shield size={15} />
                      {submitting ? "Memproses & Anchoring..." : "Kirim & Anchor ke Blockchain"}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Batal</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── NIK Search ──────────────────────────────────────── */}
        <div className="cc-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Search size={16} color="var(--color-text-3)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-1)" }}>Cek Status Laporan via NIK</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 380 }}>
              <CreditCard size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-4)", pointerEvents: "none" }} />
              <input className="cc-input" type="text" value={nikSearch} onChange={e => setNikSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setNikFilter(nikSearch)}
                placeholder="Masukkan 16 digit NIK Anda" maxLength={16}
                style={{ paddingLeft: 40 }} />
            </div>
            <button onClick={() => setNikFilter(nikSearch)} className="btn btn-blue" style={{ flexShrink: 0 }}>
              <Search size={14} /> Cari
            </button>
            {nikFilter && (
              <button onClick={() => { setNikFilter(""); setNikSearch(""); }} className="btn btn-ghost" style={{ flexShrink: 0 }}>
                <X size={14} /> Reset
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 10 }}>
            Coba NIK demo <code style={{ background: "var(--color-surface-3)", padding: "2px 6px", borderRadius: 5, fontSize: 12, color: "var(--color-text-2)" }}>3201234567800001</code> untuk melihat riwayat lengkap dengan timeline kasus.
          </p>
        </div>

        {/* ── Reports Table ───────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)" }}>
                {nikFilter ? `Laporan NIK ${nikFilter}` : "Semua Laporan"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 2 }}>{reports.length} laporan ditemukan</p>
            </div>
          </div>

          {isLoading ? (
            <div className="cc-card" style={{ padding: 48, textAlign: "center", color: "var(--color-text-4)" }}>Memuat data...</div>
          ) : reports.length === 0 ? (
            <div className="cc-card" style={{ padding: 56, textAlign: "center" }}>
              <FileText size={40} color="var(--color-border-2)" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>Belum ada laporan</p>
              <p style={{ fontSize: 13, color: "var(--color-text-4)" }}>
                {nikFilter ? `Tidak ada laporan untuk NIK ${nikFilter}` : "Klik \"Buat Laporan Baru\" untuk memulai"}
              </p>
            </div>
          ) : (
            <div className="cc-card" style={{ overflow: "hidden" }}>
              {/* Desktop table */}
              <div className="desktop-table">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>No. Laporan</th>
                      <th>Judul Kasus</th>
                      <th>Kategori</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: any) => (
                      <>
                        <tr key={r.id} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          <td><code style={{ fontSize: 12, background: "var(--color-surface-3)", padding: "3px 8px", borderRadius: 6, color: "var(--color-blue)", fontWeight: 600 }}>{r.id}</code></td>
                          <td style={{ fontWeight: 500, color: "var(--color-text-1)", maxWidth: 260 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                          </td>
                          <td style={{ textTransform: "capitalize" }}>{r.category}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{format(new Date(r.created_at), "d MMM yyyy", { locale: idLocale })}</td>
                          <td><StatusBadge stage={r.stage} resolution={r.closure?.resolution} /></td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {r.explorer_url && (
                                <a href={r.explorer_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                  title="Lihat di Solana Explorer"
                                  style={{ padding: "5px 8px", borderRadius: 6, background: "var(--color-blue-light)", color: "var(--color-blue)", border: "1px solid #bfdbfe", display: "inline-flex" }}>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              <span style={{ color: expandedId === r.id ? "var(--color-blue)" : "var(--color-text-4)" }}>
                                {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedId === r.id && (
                          <tr key={r.id + "-exp"}>
                            <td colSpan={6} style={{ padding: 0 }}>
                              <ReportDetail r={r} reopenId={reopenId} reopenReason={reopenReason}
                                setReopenId={setReopenId} setReopenReason={setReopenReason} handleReopen={handleReopen} />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mobile-cards">
                {reports.map((r: any) => (
                  <div key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <code style={{ fontSize: 11, background: "var(--color-surface-3)", padding: "2px 7px", borderRadius: 5, color: "var(--color-blue)", fontWeight: 600 }}>{r.id}</code>
                          <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-1)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 3 }}>{format(new Date(r.created_at), "d MMM yyyy", { locale: idLocale })} · {r.category}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <StatusBadge stage={r.stage} resolution={r.closure?.resolution} size="sm" />
                          {expandedId === r.id ? <ChevronUp size={14} color="var(--color-text-4)" /> : <ChevronDown size={14} color="var(--color-text-4)" />}
                        </div>
                      </div>
                    </div>
                    {expandedId === r.id && (
                      <ReportDetail r={r} reopenId={reopenId} reopenReason={reopenReason}
                        setReopenId={setReopenId} setReopenReason={setReopenReason} handleReopen={handleReopen} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <TransactionDetailDialog open={!!txDialogReport} onClose={() => setTxDialogReport(null)} report={txDialogReport} />

      <style>{`
        .desktop-table { display: block; }
        .mobile-cards  { display: none; }
        @media (max-width: 640px) {
          .desktop-table { display: none; }
          .mobile-cards  { display: block; }
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */
function ReportDetail({ r, reopenId, reopenReason, setReopenId, setReopenReason, handleReopen }: any) {
  return (
    <div style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)", padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-4)", marginBottom: 6 }}>Kronologi</p>
          <p style={{ fontSize: 13.5, color: "var(--color-text-2)", lineHeight: 1.65 }}>{r.chronology}</p>

          {r.explorer_url && (
            <a href={r.explorer_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--color-blue)", background: "var(--color-blue-light)", border: "1px solid #bfdbfe", padding: "6px 12px", borderRadius: 8, textDecoration: "none" }}>
              <ExternalLink size={12} /> Verifikasi di Solana Explorer
            </a>
          )}

          {r.stage === "closed" && (
            <div style={{ marginTop: 12 }}>
              {reopenId === r.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea className="cc-input" style={{ resize: "none", fontSize: 13 }} rows={2}
                    value={reopenReason} onChange={e => setReopenReason(e.target.value)}
                    placeholder="Alasan membuka kembali kasus ini..." />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleReopen(r.id)} disabled={!reopenReason.trim()} className="btn btn-sm" style={{ background: "#ea580c", color: "white" }}>
                      <RotateCcw size={12} /> Konfirmasi Reopen
                    </button>
                    <button onClick={() => { setReopenId(null); setReopenReason(""); }} className="btn btn-ghost btn-sm">Batal</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setReopenId(r.id)} className="btn btn-sm" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" }}>
                  <RotateCcw size={12} /> Buka Kembali Kasus
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-4)", marginBottom: 10 }}>Timeline Kasus</p>
          <CaseTimeline reportId={r.id} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, iconBg, title, desc }: { icon: React.ReactNode; iconBg: string; title: string; desc: string }) {
  return (
    <div className="cc-card cc-card-hover" style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-1)", marginBottom: 5 }}>{title}</p>
        <p style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
