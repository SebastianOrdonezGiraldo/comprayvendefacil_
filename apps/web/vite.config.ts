import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: {
    // En desarrollo la web y la API comparten origen: las cookies de sesión funcionan sin configurar nada.
    proxy: { "/api": "http://localhost:3000" },
  },
});
