import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Configuração do Proxy: A ponte mágica entre o React e o FastAPI
    proxy: {
      "/api": {
        target: "http://localhost:8000", // O endereço do nosso Backend Python
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
