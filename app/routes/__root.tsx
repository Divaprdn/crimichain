import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { UserProvider } from "~/lib/crimichain-store";
import "~/styles.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CrimiChain – Pelaporan Kejahatan Berbasis Blockchain" },
      {
        name: "description",
        content:
          "Sistem pelaporan kejahatan transparan berbasis Solana blockchain untuk warga dan kepolisian.",
      },
      { property: "og:title", content: "CrimiChain" },
      {
        property: "og:description",
        content: "Laporan kejahatan dianchor di Solana Devnet untuk transparansi penuh.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <UserProvider>
          <Outlet />
        </UserProvider>
        <Scripts />
      </body>
    </html>
  );
}
