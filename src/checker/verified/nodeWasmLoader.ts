import { createRequire } from "node:module";
import path from "node:path";
import { PresentationFile, VerifiedCheckOutput } from "./presentationTypes";

type WasmGlobals = typeof globalThis & {
  enderCheckProof?: (source: string) => string;
  enderParsePresentation?: (source: string) => string;
};

let initialization: Promise<WasmGlobals> | undefined;

const initialize = async (): Promise<WasmGlobals> => {
  if (initialization) return initialization;
  initialization = (async () => {
    const directory = process.env.ENDER_CHECKER_WASM_DIR;
    if (!directory) {
      throw new Error(
        "ENDER_CHECKER_WASM_DIR is required; run this command inside `nix develop`",
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
        typeof globals.enderParsePresentation === "function"
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
