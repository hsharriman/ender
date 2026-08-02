const [apiPath, proofPath] = process.argv.slice(2);
require(apiPath);

const waitForApi = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (typeof globalThis.enderCheckProof === "function") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Wasm checker API did not initialize");
};

(async () => {
  await waitForApi();
  const source = require("node:fs").readFileSync(proofPath, "utf8");
  process.stdout.write(globalThis.enderCheckProof(source) + "\n");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
