import { ExternalLink, X, Hash, Shield, Server, User, FileText, Layers } from "lucide-react";

interface TransactionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  report: any;
}

export function TransactionDetailDialog({ open, onClose, report }: TransactionDetailDialogProps) {
  if (!open || !report) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: "var(--color-accent-cyan)" }} />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
              Detail Transaksi Blockchain
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <Row icon={<FileText size={14} />} label="Laporan ID" value={report.id} />
          <Row icon={<Hash size={14} />} label="SHA-256 Hash" value={report.hash} mono />
          {report.tx_id && (
            <Row icon={<Shield size={14} />} label="Signature" value={report.tx_id} mono />
          )}
          {report.explorer_url && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink size={14} style={{ color: "var(--color-accent-cyan)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Explorer URL
                </span>
              </div>
              <a
                href={report.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs break-all"
                style={{ color: "var(--color-accent-cyan)" }}
              >
                {report.explorer_url}
              </a>
            </div>
          )}
          <Row icon={<Server size={14} />} label="Cluster" value="devnet" />
          <Row icon={<Layers size={14} />} label="Stage Saat Ini" value={report.stage} />

          {/* No tx */}
          {!report.tx_id && (
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}
            >
              Transaksi belum dianchor — isi SOLANA_PAYER_SECRET_KEY dan pastikan ada SOL di wallet.
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 flex justify-end"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: "var(--color-accent-cyan)" }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <p className={`text-xs break-all ${mono ? "font-mono" : ""}`} style={{ color: "var(--color-text-secondary)" }}>
        {value}
      </p>
    </div>
  );
}
