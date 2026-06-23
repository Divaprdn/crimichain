import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser } from "~/lib/crimichain-store";
import { Shield, Lock, User, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login Petugas – CrimiChain" },
      { name: "description", content: "Halaman login untuk petugas kepolisian CrimiChain." },
    ],
  }),
  component: LoginPage,
});

const POLICE_ACCOUNTS = [
  { username: "admin",   password: "admin123",   name: "Administrator", badge: "ADM-001" },
  { username: "polisi1", password: "polisi123",  name: "Brigadir Satu", badge: "BRG-001" },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const account = POLICE_ACCOUNTS.find(a => a.username === username && a.password === password);
    if (account) {
      login({ username: account.username, name: account.name, badge: account.badge, role: "police" });
      navigate({ to: "/" });
    } else {
      setError("Username atau password salah.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-bg)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "var(--color-navy)", marginBottom: 14 }}>
            <Shield size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-1)" }}>CrimiChain</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", marginTop: 4 }}>Portal Petugas Kepolisian</p>
        </div>

        <div className="cc-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-1)", marginBottom: 24 }}>Masuk Akun Petugas</h2>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#fff1f2", border: "1px solid #fda4af", color: "#be123c", fontSize: 13, marginBottom: 18 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>Username</label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-4)", pointerEvents: "none" }} />
                <input className="cc-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-4)", pointerEvents: "none" }} />
                <input className="cc-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 4, padding: "12px 20px" }}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)", fontSize: 12, textAlign: "center", color: "var(--color-text-4)" }}>
            Demo: <code style={{ background: "var(--color-surface-3)", padding: "2px 6px", borderRadius: 4 }}>admin / admin123</code>
            {" · "}
            <code style={{ background: "var(--color-surface-3)", padding: "2px 6px", borderRadius: 4 }}>polisi1 / polisi123</code>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, marginTop: 20 }}>
          <a href="/" style={{ color: "var(--color-blue)", textDecoration: "none", fontWeight: 500 }}>← Kembali ke beranda warga</a>
        </p>
      </div>
    </div>
  );
}
