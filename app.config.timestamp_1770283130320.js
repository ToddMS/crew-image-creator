// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
var app_config_default = defineConfig({
  // TanStack Start configuration
  routers: {
    ssr: {
      // Enable server-side rendering
      entry: "./src/ssr.tsx"
    },
    client: {
      // Client-side entry
      entry: "./src/client.tsx"
    }
  }
});
export {
  app_config_default as default
};
