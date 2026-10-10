import { VerifiedCheckReport } from "./presentationTypes";

let initialization: Promise<void> | undefined;

const waitForExports = async (): Promise<void> => {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (typeof window.enderCheckReport === "function") return;
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

export const checkVerifiedReport = async (
  source: string,
): Promise<VerifiedCheckReport> => {
  await initialize();
  return JSON.parse(window.enderCheckReport!(source)) as VerifiedCheckReport;
};
