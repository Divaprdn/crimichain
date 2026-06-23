import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "~/components/AppHeader";
import { CitizenDashboard } from "~/components/CitizenDashboard";
import { PoliceDashboard } from "~/components/PoliceDashboard";
import { useCurrentUser } from "~/lib/crimichain-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrimiChain – Beranda Pelaporan Kejahatan" },
      {
        name: "description",
        content: "Laporkan kejahatan secara anonim dan transparan melalui blockchain Solana.",
      },
      { property: "og:title", content: "CrimiChain – Beranda" },
      {
        property: "og:description",
        content: "Platform pelaporan kejahatan berbasis blockchain untuk warga Indonesia.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useCurrentUser();
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <AppHeader />
      {user?.role === "police" ? <PoliceDashboardWrapper /> : <CitizenDashboard />}
    </div>
  );
}

function PoliceDashboardWrapper() {
  return (
    <div style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="cc-container">
        <PoliceDashboard />
      </div>
    </div>
  );
}
