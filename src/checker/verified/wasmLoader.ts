import { PresentationFile, VerifiedCheckOutput } from "./presentationTypes";

let initialization: Promise<void> | undefined;

const waitForExports = async (): Promise<void> => {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (
      typeof window.enderCheckProof === "function" &&
      typeof window.enderParsePresentation === "function"
    ) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 10));
  }
  throw new Error("Verified checker Wasm exports did not initialize");
};

const initialize = (): Promise<void> => {
  if (initialization) return initialization;
  initialization = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}ender-checker-wasm/ender-checker-api.js`;
    script.async = true;
    script.onerror = () => reject(new Error(`Unable to load ${script.src}`));
    script.onload = () => waitForExports().then(resolve, reject);
    document.head.appendChild(script);
  });
  return initialization;
};

export const parsePresentation = async (
  source: string,
): Promise<PresentationFile> => {
  await initialize();
  const encoded = window.enderParsePresentation!(source);
  const parsed = JSON.parse(encoded) as PresentationFile | null;
  if (!parsed) throw new Error("Rocq presentation parser rejected the source");
  return parsed;
};

export const checkVerifiedProof = async (
  source: string,
): Promise<VerifiedCheckOutput> => {
  await initialize();
  return JSON.parse(window.enderCheckProof!(source)) as VerifiedCheckOutput;
};
