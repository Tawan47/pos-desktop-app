import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",       // ← เพิ่มบรรทัดนี้
  plugins: [react()],
});
