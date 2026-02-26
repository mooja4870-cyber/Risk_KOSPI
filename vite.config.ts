import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/naver-api": {
        target: "https://m.stock.naver.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/naver-api/, ""),
      },
      "/polling-api": {
        target: "https://polling.finance.naver.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/polling-api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
