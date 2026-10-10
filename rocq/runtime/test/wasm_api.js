// Print what the Wasm API's `enderCheckProof` says about a proof file, after
// checking that `enderCheckReport` agrees with it and carries a presentation.
// Usage: node wasm_api.js ender-checker-api.js PROOF_FILE
const [apiPath, proofPath] = process.argv.slice(2);
require(require("node:path").resolve(apiPath));

const waitForApi = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (
      typeof globalThis.enderCheckProof === "function" &&
      typeof globalThis.enderParsePresentation === "function" &&
      typeof globalThis.enderCheckReport === "function"
    )
      return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Wasm checker API did not initialize");
};

(async () => {
  await waitForApi();
  const source = require("node:fs").readFileSync(proofPath, "utf8");
  const output = globalThis.enderCheckProof(source);
  const report = JSON.parse(globalThis.enderCheckReport(source));
  if ((report.verdict === "accepted") !== JSON.parse(output).isCorrect)
    throw new Error(`report verdict ${report.verdict} disagrees with the check`);
  if (report.presentation === null)
    throw new Error("report carries no presentation");
  process.stdout.write(output + "\n");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
