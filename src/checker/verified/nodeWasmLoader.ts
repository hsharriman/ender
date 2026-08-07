import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  PresentationFile,
  VerifiedCheckOutput,
  VerifiedCheckReport,
} from "./presentationTypes";

// Where `make -C rocq wasm` leaves its output.  Resolved against this file
// rather than the working directory so that the checker is found from any
// subdirectory.  ENDER_CHECKER_WASM_DIR overrides it, which is how a Nix-built
// bundle or a container image gets used instead.
const defaultWasmDirectory = path.resolve(
  __dirname,
  "../../../rocq/_build/wasm",
);

type WasmGlobals = typeof globalThis & {
  enderCheckProof?: (source: string) => string;
  enderParsePresentation?: (source: string) => string;
  enderCheckReport?: (source: string) => string;
};

let initialization: Promise<WasmGlobals> | undefined;

const initialize = async (): Promise<WasmGlobals> => {
  if (initialization) return initialization;
  initialization = (async () => {
    const directory =
      process.env.ENDER_CHECKER_WASM_DIR ?? defaultWasmDirectory;
    if (!fs.existsSync(path.join(directory, "ender-checker-api.js"))) {
      throw new Error(
        `no verified checker in ${directory}; build it with \`make -C rocq wasm\`` +
          " or point ENDER_CHECKER_WASM_DIR at one",
      );
    }
    // The generated js_of_ocaml loader is CommonJS.  Loading it through a
    // real Node require also avoids Jest trying to resolve the Nix-store path
    // as a TypeScript module.
    const requireFromProject = createRequire(
      path.join(process.cwd(), "package.json"),
    );
    requireFromProject(path.join(directory, "ender-checker-api.js"));
    const globals = globalThis as WasmGlobals;
    for (let attempt = 0; attempt < 500; attempt += 1) {
      if (
        typeof globals.enderCheckProof === "function" &&
        typeof globals.enderParsePresentation === "function" &&
        typeof globals.enderCheckReport === "function"
      ) {
        return globals;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error("Verified checker Wasm exports did not initialize");
  })();
  return initialization;
};

export const checkVerifiedProofNode = async (
  source: string,
): Promise<VerifiedCheckOutput> => {
  const wasm = await initialize();
  return JSON.parse(wasm.enderCheckProof!(source)) as VerifiedCheckOutput;
};

export const parsePresentationNode = async (
  source: string,
): Promise<PresentationFile> => {
  const wasm = await initialize();
  const result = JSON.parse(
    wasm.enderParsePresentation!(source),
  ) as PresentationFile | null;
  if (!result) throw new Error("Rocq presentation parser rejected the source");
  return result;
};

export const checkVerifiedReportNode = async (
  source: string,
): Promise<VerifiedCheckReport> => {
  const wasm = await initialize();
  return JSON.parse(wasm.enderCheckReport!(source)) as VerifiedCheckReport;
};
