import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const APP_ENVIRONMENT = process.env.VITE_ENVIRONMENT || process.env.ENVIRONMENT || process.env.NODE_ENV;
const isDevEnvironment = APP_ENVIRONMENT === "development" || APP_ENVIRONMENT === "test";

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "node-server",
      routeRules: {
        "/**": {
          headers: {
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          }
        }
      }
    }),
    viteReact(),
  ],
  build: {
    sourcemap: isDevEnvironment,
  },
  server: {
    allowedHosts: ["onboarding.abacus.local", "localhost", "127.0.0.1"],
    watch: { usePolling: true },
  },
});

export default config;
