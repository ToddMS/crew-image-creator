// vite.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
var vite_config_default = defineConfig({
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"]
      }),
      tailwindcss()
    ],
    // Environment variable prefix
    envPrefix: ["VITE_", "DATABASE_URL", "NEXTAUTH_"],
    // Development server configuration
    server: {
      port: 3e3,
      host: true,
      hmr: {
        overlay: true
      }
    },
    // Build configuration
    build: {
      target: "esnext",
      minify: "terser",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            trpc: ["@trpc/client", "@trpc/server", "@trpc/react-query"],
            tanstack: [
              "@tanstack/react-query",
              "@tanstack/react-router",
              "@tanstack/react-start"
            ],
            utils: ["zod", "clsx", "tailwind-merge"]
          }
        }
      },
      chunkSizeWarningLimit: 1e3
    },
    // Optimization
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@trpc/client",
        "@trpc/react-query",
        "zod",
        "clsx",
        "tailwind-merge"
      ],
      exclude: ["@prisma/client"]
    },
    // SSR configuration
    ssr: {
      external: ["@prisma/client"],
      noExternal: [],
      target: "node"
    }
  },
  server: {
    preset: "node-server"
  }
});
export {
  vite_config_default as default
};
