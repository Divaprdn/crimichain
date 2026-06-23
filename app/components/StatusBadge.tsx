const STAGE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  submitted:         { label: "Dilaporkan",         bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  assigned:          { label: "Ditugaskan",          bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
  investigating:     { label: "Investigasi",         bg: "#fefce8", color: "#92400e", border: "#fde68a" },
  closed:            { label: "Selesai",             bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  "closed-solved":   { label: "Terselesaikan",       bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  "closed-unsolved": { label: "Tidak Terselesaikan", bg: "#f9fafb", color: "#6b7280", border: "#d1d5db" },
  "closed-false":    { label: "Laporan Palsu",       bg: "#fff1f2", color: "#be123c", border: "#fda4af" },
  reopened:          { label: "Dibuka Kembali",      bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
};

export function StatusBadge({ stage, resolution, size = "md" }: {
  stage: string; resolution?: string; size?: "sm" | "md";
}) {
  let key = stage;
  if (stage === "closed" && resolution) key = `closed-${resolution === "false_report" ? "false" : resolution}`;
  const c = STAGE_CONFIG[key] || STAGE_CONFIG.submitted;
  return (
    <span className="badge" style={{
      background: c.bg, color: c.color, borderColor: c.border,
      fontSize: size === "sm" ? 11 : 12,
      padding: size === "sm" ? "2px 8px" : "3px 10px",
    }}>
      {c.label}
    </span>
  );
}
