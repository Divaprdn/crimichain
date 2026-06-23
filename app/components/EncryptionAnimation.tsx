import { Shield, Link as LinkIcon, Lock } from "lucide-react";

export function EncryptionAnimation({ message = "Menganchor ke Solana Devnet..." }: { message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-10"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {/* Chain animation */}
      <div className="relative flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border-2)" }}
        >
          <Lock size={22} style={{ color: "var(--color-accent-amber)" }} />
        </div>

        {/* Animated chain links */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "var(--color-accent-cyan)",
                opacity: 0.2,
                animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center animate-spin-slow"
          style={{
            background: "var(--color-surface-3)",
            border: "2px solid var(--color-accent-cyan)",
            boxShadow: "0 0 16px rgba(0,212,255,0.3)",
          }}
        >
          <Shield size={22} style={{ color: "var(--color-accent-cyan)" }} />
        </div>
      </div>

      {/* Hash scroll */}
      <div
        className="font-mono text-xs px-4 py-2 rounded-lg overflow-hidden relative w-full max-w-sm"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
      >
        <div
          style={{
            animation: "chain-link 2s ease-in-out infinite",
            color: "var(--color-accent-cyan)",
            whiteSpace: "nowrap",
          }}
        >
          SHA-256 → Memo TX → Devnet → Confirmed
        </div>
      </div>

      <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {message}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
