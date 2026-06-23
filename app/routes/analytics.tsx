import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listReports } from "~/lib/crimichain.functions";
import { AppHeader } from "~/components/AppHeader";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { startOfWeek, format, differenceInHours } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TrendingUp, FileText, Search, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analitik – CrimiChain" }] }),
  component: AnalyticsPage,
});

const CAT_COLORS  = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706"];
const STAGE_COLORS: Record<string, string> = {
  submitted: "#64748b", assigned: "#2563eb",
  investigating: "#d97706", closed: "#059669", reopened: "#ea580c",
};

const TT_STYLE = {
  backgroundColor: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 10, color: "#0f172a", fontSize: 12,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

function AnalyticsPage() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"], queryFn: () => listReports({}),
  });

  const byCategory = Object.entries(
    reports.reduce((a: any, r: any) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byStage = Object.entries(
    reports.reduce((a: any, r: any) => {
      const k = r.stage.startsWith("closed") ? "closed" : r.stage;
      a[k] = (a[k] || 0) + 1; return a;
    }, {})
  ).map(([name, value]) => ({ name, value, fill: STAGE_COLORS[name] || "#64748b" }));

  const weekMap: Record<string, number> = {};
  reports.forEach((r: any) => {
    const w = format(startOfWeek(new Date(r.created_at), { locale: idLocale }), "dd MMM", { locale: idLocale });
    weekMap[w] = (weekMap[w] || 0) + 1;
  });
  const byWeek = Object.entries(weekMap).map(([week, count]) => ({ week, count }));

  const closed    = reports.filter((r: any) => r.stage.startsWith("closed") && r.investigation_started_at && r.closure?.closed_at);
  const avgHours  = closed.length ? Math.round(closed.reduce((s: number, r: any) => s + differenceInHours(new Date(r.closure.closed_at), new Date(r.investigation_started_at)), 0) / closed.length) : null;
  const solvedPct = closed.length ? Math.round((reports.filter((r: any) => r.closure?.resolution === "solved").length / reports.filter((r: any) => r.stage.startsWith("closed")).length) * 100) : null;

  const resMap: Record<string, number> = {};
  reports.forEach((r: any) => { if (r.closure?.resolution) resMap[r.closure.resolution] = (resMap[r.closure.resolution] || 0) + 1; });
  const resColors: Record<string, string> = { solved: "#059669", unsolved: "#6b7280", false_report: "#dc2626" };
  const byResolution = Object.entries(resMap).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Total Laporan",       value: reports.length,                                              icon: <FileText size={18} color="#2563eb" />,  bg: "#eff6ff" },
    { label: "Sedang Investigasi",  value: reports.filter((r: any) => r.stage === "investigating").length, icon: <Search size={18} color="#d97706" />,   bg: "#fefce8" },
    { label: "Rata-rata Investigasi",value: avgHours != null ? `${avgHours} jam` : "—",                 icon: <TrendingUp size={18} color="#7c3aed" />, bg: "#f5f3ff" },
    { label: "Persentase Solved",   value: solvedPct != null ? `${solvedPct}%` : "—",                   icon: <CheckCircle size={18} color="#059669" />, bg: "#f0fdf4" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <AppHeader />
      <div style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="cc-container">

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-1)", marginBottom: 6 }}>Analitik Laporan</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-3)" }}>Visualisasi data berdasarkan {reports.length} laporan tercatat</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
            {stats.map(s => (
              <div key={s.label} className="cc-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-1)", lineHeight: 1.1 }}>{isLoading ? "—" : s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          {isLoading ? (
            <div className="cc-card" style={{ padding: 48, textAlign: "center", color: "var(--color-text-4)" }}>Memuat data...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 20 }}>
              <ChartCard title="Laporan per Kategori">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byCategory} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                      {byCategory.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Distribusi Status Laporan">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                      label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                      {byStage.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Tren Laporan per Minggu">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={byWeek} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Hasil Penyelesaian Kasus">
                {byResolution.length === 0 ? (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-4)", fontSize: 13 }}>Belum ada kasus selesai</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byResolution} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={TT_STYLE} />
                      <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                        {byResolution.map((e, i) => <Cell key={i} fill={resColors[e.name] || "#64748b"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cc-card" style={{ padding: 22 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-2)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      {children}
    </div>
  );
}
