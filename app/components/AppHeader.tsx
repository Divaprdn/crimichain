import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Shield, LogOut, BarChart2, Search, Activity, LayoutDashboard, Menu, X } from "lucide-react";
import { useCurrentUser } from "~/lib/crimichain-store";
import { useState } from "react";

const NAV = [
  { to: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { to: "/audit",       label: "Audit Trail", icon: Search },
  { to: "/analytics",   label: "Analitik",    icon: BarChart2 },
  { to: "/diagnostics", label: "Diagnostics", icon: Activity },
];

export function AppHeader() {
  const { user, logout } = useCurrentUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = () => { logout(); navigate({ to: "/" }); };

  return (
    <header style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 3px rgb(0 0 0 / 0.06)" }}>
      <div className="cc-container" style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={17} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-1)", lineHeight: 1.2 }}>CrimiChain</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-4)" }}>Blockchain Integrity</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }} className="hidden-mobile">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = currentPath === to;
            return (
              <Link key={to} to={to} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                fontSize: 14, fontWeight: active ? 600 : 500, textDecoration: "none",
                background: active ? "var(--color-navy)" : "transparent",
                color: active ? "#fff" : "var(--color-text-3)",
                transition: "all 0.15s",
              }}>
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <div className="hidden-mobile" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-1)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-4)" }}>{user.badge}</div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                <LogOut size={13} />
                <span className="hidden-mobile">Keluar</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              Masuk
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-text-2)" }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border)", padding: "12px 24px 16px" }} className="show-mobile">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              fontSize: 15, fontWeight: 500, color: currentPath === to ? "var(--color-blue)" : "var(--color-text-2)",
              textDecoration: "none", borderBottom: "1px solid var(--color-border)",
            }}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .hidden-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </header>
  );
}
