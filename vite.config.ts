import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig, Plugin } from "vite";

// Where `make -C rocq wasm` leaves its output; ENDER_CHECKER_WASM_DIR overrides
// it, which is how a Nix-built bundle or a container image gets used instead.
const wasmDirectory = (): string | undefined => {
  const directory =
    process.env.ENDER_CHECKER_WASM_DIR ??
    path.resolve(__dirname, "rocq/_build/wasm");
  return fs.existsSync(path.join(directory, "ender-checker-api.js"))
    ? directory
    : undefined;
};

const verifiedCheckerAssets = (): Plugin => {
  const directory = wasmDirectory();
  const files = directory
    ? (fs.readdirSync(directory, { recursive: true, encoding: "utf8" }) as string[]).filter((entry) =>
        fs.statSync(path.join(directory, entry)).isFile(),
      )
    : [];
  return {
    name: "verified-checker-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const marker = "/ender-checker-wasm/";
        const index = request.url?.indexOf(marker) ?? -1;
        if (!directory || index < 0) return next();
        const relative = decodeURIComponent(request.url!.slice(index + marker.length));
        const target = path.resolve(directory, relative);
        if (!target.startsWith(`${path.resolve(directory)}${path.sep}`)) return next();
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return next();
        response.setHeader(
          "Content-Type",
          target.endsWith(".wasm") ? "application/wasm" : "text/javascript",
        );
        fs.createReadStream(target).pipe(response);
      });
    },
    generateBundle() {
      if (!directory) {
        throw new Error(
          "no verified checker to bundle; build it with `make -C rocq wasm`" +
            " or point ENDER_CHECKER_WASM_DIR at one",
        );
      }
      for (const entry of files) {
        const relative = String(entry);
        this.emitFile({
          type: "asset",
          fileName: `ender-checker-wasm/${relative}`,
          source: fs.readFileSync(path.join(directory, relative)),
        });
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), verifiedCheckerAssets()],
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
    host: true,
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL ?? "http://localhost:5000",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
      },
    },
  },
});
