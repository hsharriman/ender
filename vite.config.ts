import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/ender/",
  resolve: {
    alias: {
      checker: path.resolve(__dirname, "src/checker"),
      interface: path.resolve(__dirname, "src/interface"),
      "geometry-object": path.resolve(__dirname, "src/geometry-object"),
    },
  },
  server: {
    port: 3000,
  },
});
