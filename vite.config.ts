import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    nodePolyfills({ include: ["buffer", "crypto", "stream", "util", "process"] }),
    tanstackStart({
      srcDirectory: "app",
      router: {
        routesDirectory: "routes",
      },
      server: {
        entry: "./app/ssr.tsx",
      },
      client: {
        entry: "./app/client.tsx",
      },
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
});
