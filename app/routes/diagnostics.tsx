import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBlockchainDiagnostics, anchorHashOnDevnet } from "~/lib/solana.functions";
import { AppHeader } from "~/components/AppHeader";
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Zap, Wifi, Wallet, Server } from "lucide-react";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({ meta: [{ title: "Diagnostik – CrimiChain" }] }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["diagnostics"], queryFn: getBlockchainDiagnostics, refetchInterval: 30_000,
  });
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await anchorHashOnDevnet({ data: { hash: "TEST_" + Date.now(), action: "DIAGNOSTICS_TEST", reportId: "TEST-000" } });
      setTestResult({ ok: true, data: r });
    } catch (err: any) { setTestResult({ ok: false, error: err.message }); }
    finally { setTesting(false); refetch(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <AppHeader />
      <div style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="cc-container">

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-1)", marginBottom: 6 }}>Diagnostik Blockchain</h1>
              <p style={{ fontSize: 14, color: "var(--color-text-3)" }}>Status koneksi RPC, wallet payer, dan environment sistem</p>
            </div>
            <button onClick={handleTest} disabled={testing} className="btn btn-blue">
              <Zap size={16} /> {testing ? "Mengirim..." : "Test Anchor"}
            </button>
          </div>

          {/* Test result */}
          {testResult && (
            <div className="animate-fade-up" style={{
              padding: "14px 20px", borderRadius: 12, marginBottom: 24,
              background: testResult.ok ? "#f0fdf4" : "#fff1f2",
              border: `1px solid ${testResult.ok ? "#86efac" : "#fda4af"}`,
            }}>
              {testResult.ok ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#15803d", marginBottom: 6 }}>
                    <CheckCircle size={16} /> Test anchor berhasil
                  </div>
                  <code style={{ fontSize: 12, color: "#4ade80" }}>Sig: {testResult.data?.signature?.slice(0, 20)}…</code>
                  {testResult.data?.explorerUrl && (
                    <a href={testResult.data.explorerUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                      <ExternalLink size={12} /> Lihat di Solana Explorer
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#be123c", fontWeight: 600, fontSize: 14 }}>
                  <XCircle size={16} /> Gagal: {testResult.error}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="cc-card" style={{ padding: 48, textAlign: "center", color: "var(--color-text-4)" }}>Memuat diagnostik...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* RPC */}
              <Section title="Status RPC" icon={<Wifi size={16} color="#2563eb" />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data?.rpcs?.map((rpc: any) => (
                    <div key={rpc.url} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {rpc.ok ? <CheckCircle size={15} color="#15803d" /> : <XCircle size={15} color="#dc2626" />}
                        <code style={{ fontSize: 12.5, color: "var(--color-text-2)" }}>{rpc.url}</code>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rpc.ok ? "#15803d" : "#dc2626", background: rpc.ok ? "#f0fdf4" : "#fff1f2", padding: "3px 10px", borderRadius: 99, border: `1px solid ${rpc.ok ? "#86efac" : "#fda4af"}` }}>
                        {rpc.ok ? `${rpc.latencyMs}ms` : "Offline"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Payer Wallet */}
              <Section title="Payer Wallet" icon={<Wallet size={16} color="#7c3aed" />}>
                {data?.payer?.ephemeral && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, marginBottom: 14 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Keypair sementara (ephemeral) — isi <code style={{ background: "#fef9c3", padding: "1px 5px", borderRadius: 4 }}>VITE_SOLANA_PAYER_SECRET_KEY</code> untuk anchoring nyata</span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <InfoRow label="Pubkey" value={data?.payer?.pubkey || "—"} mono />
                  <InfoRow label="Saldo" value={data?.payer?.balanceSol != null ? `${data.payer.balanceSol} SOL` : "—"} warn={data?.payer?.balanceSol === 0} />
                </div>
              </Section>

              {/* Env */}
              <Section title="Environment Variables" icon={<Server size={16} color="#059669" />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(data?.env || {}).map(([k, v]: any) => (
                    <InfoRow key={k} label={k} value={v} mono />
                  ))}
                </div>
              </Section>

              {/* Events */}
              <Section title="Blockchain Events Terbaru" icon={<CheckCircle size={16} color="#2563eb" />}>
                <div className="cc-card" style={{ overflow: "hidden", boxShadow: "none", border: "1px solid var(--color-border)" }}>
                  <table className="cc-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Waktu</th><th>Aksi</th><th>Laporan</th>
                        <th>Status</th><th>Signature</th><th>RPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentEvents || []).length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--color-text-4)" }}>Belum ada events</td></tr>
                      ) : (data?.recentEvents || []).map((ev: any) => (
                        <tr key={ev.id}>
                          <td style={{ whiteSpace: "nowrap" }}>{new Date(ev.ts).toLocaleString("id-ID")}</td>
                          <td>{ev.action}</td>
                          <td><code style={{ color: "var(--color-blue)", fontWeight: 600 }}>{ev.report_id || "—"}</code></td>
                          <td>{ev.ok ? <span style={{ color: "#15803d", fontWeight: 600 }}>✓ OK</span> : <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Gagal</span>}</td>
                          <td>
                            {ev.signature ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <code>{ev.signature.slice(0, 8)}…</code>
                                {ev.explorer_url && <a href={ev.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-blue)" }}><ExternalLink size={11} /></a>}
                              </div>
                            ) : "—"}
                          </td>
                          <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.rpc || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cc-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        {icon}
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-1)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, warn = false }: { label: string; value: string; mono?: boolean; warn?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "9px 12px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-4)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: mono ? "monospace" : "inherit", color: warn ? "#dc2626" : "var(--color-text-2)", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
