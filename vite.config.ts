import react from "@vitejs/plugin-react";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { defineConfig, Plugin } from "vite";

// Where `make -C rocq wasm` leaves its output; GHOST_CHECKER_WASM_DIR overrides
// it, which is how a Nix-built bundle or a container image gets used instead.
const wasmDirectory = (): string | undefined => {
  const directory =
    process.env.GHOST_CHECKER_WASM_DIR ??
    path.resolve(__dirname, "rocq/_build/wasm");
  return fs.existsSync(path.join(directory, "ghost-checker-api.js"))
    ? directory
    : undefined;
};

const checkerFiles = (directory: string | undefined): string[] =>
  directory
    ? (fs.readdirSync(directory, { recursive: true, encoding: "utf8" }) as string[])
        .filter((entry) => fs.statSync(path.join(directory, entry)).isFile())
        .sort()
    : [];

// A digest of the whole bundle, appended to the loader's URL so a browser
// holding an older checker in its cache fetches the new one after a deploy.
const checkerVersion = (directory: string | undefined): string => {
  if (!directory) return "missing";
  const hash = crypto.createHash("sha256");
  for (const relative of checkerFiles(directory)) {
    hash.update(relative);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(directory, relative)));
  }
  return hash.digest("hex").slice(0, 16);
};

const verifiedCheckerAssets = (): Plugin => {
  const directory = wasmDirectory();
  const files = checkerFiles(directory);
  return {
    name: "verified-checker-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const marker = "/ghost-checker-wasm/";
        const index = request.url?.indexOf(marker) ?? -1;
        if (!directory || index < 0) return next();
        // Drop the `?v=` cache-busting query the loader appends.
        const relative = decodeURIComponent(
          request.url!.slice(index + marker.length).split("?")[0],
        );
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
            " or point GHOST_CHECKER_WASM_DIR at one",
        );
      }
      for (const relative of files) {
        this.emitFile({
          type: "asset",
          fileName: `ghost-checker-wasm/${relative}`,
          source: fs.readFileSync(path.join(directory, relative)),
        });
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), verifiedCheckerAssets()],
  define: {
    __GHOST_CHECKER_VERSION__: JSON.stringify(checkerVersion(wasmDirectory())),
  },
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
