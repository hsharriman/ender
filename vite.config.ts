import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/ender/",
  envDir: path.resolve(__dirname, "src/llm-feedback"),
  resolve: {
    alias: {
      checker: path.resolve(__dirname, "src/checker"),
      interface: path.resolve(__dirname, "src/interface"),
      "llm-feedback": path.resolve(__dirname, "src/llm-feedback"),
      "geometry-object": path.resolve(__dirname, "src/geometry-object"),
    },
  },
  server: {
    port: 3000,
  },
});
