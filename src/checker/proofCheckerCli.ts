import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { ErrorType } from "./errors/errorConstants";
import {
  collectProofCheckerErrors,
  runProofCheckerFromText,
} from "./proofChecker";
import { ErrorDetails } from "./types/checkerTypes";

type CliOutput =
  | { isCorrect: boolean; issues: ErrorDetails[] }
  | { isCorrect: false; errors: ErrorDetails[] };

const checkProof = (filePath: string): void => {
  try {
    const result = runProofCheckerFromText(readFileSync(filePath, "utf-8"));

    let output: CliOutput;
    if (result.errors.length > 0) {
      output = { isCorrect: false, errors: result.errors };
    } else {
      output = {
        isCorrect: result.proof.isCorrect,
        issues: collectProofCheckerErrors(result),
      };
    }

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
              type: ErrorType.UnclassifiedError,
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
  checkProof(proofFile);
}
