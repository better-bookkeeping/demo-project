import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "node-server",
    }),
    viteReact(),
  ],
  build: {
    sourcemap: process.env.ENVIRONMENT === "development" || process.env.ENVIRONMENT === "test",
  },
  server: {
    allowedHosts: ["onboarding.abacus.local"],
    watch: { usePolling: true },
  },
});

export default config;
