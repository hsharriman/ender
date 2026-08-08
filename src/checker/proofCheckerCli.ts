import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { checkVerifiedProofNode } from "./verified/nodeWasmLoader";

const checkProof = async (filePath: string): Promise<void> => {
  try {
    const output = await checkVerifiedProofNode(readFileSync(filePath, "utf-8"));

    console.log(JSON.stringify(output, null, 2));
    if (!output.isCorrect) process.exitCode = 1;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          isCorrect: false,
          errors: [
            {
              type: 16,
              code: "unexpected_error",
              details: { msg },
            },
          ],
        },
        null,
        2,
      ),
    );
    process.exitCode = 0;
  }
};

export { checkProof };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const proofFile = process.argv[2];
  if (!proofFile) {
    console.error("Usage: npm run checkProof <proof-file>");
    process.exit(1);
  }
  void checkProof(proofFile);
}
