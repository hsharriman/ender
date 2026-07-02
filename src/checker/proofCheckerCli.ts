import { readFileSync } from "fs";
import { basename } from "path";
import {
  collectProofCheckerIssues,
  runProofCheckerFromText,
} from "./proofChecker";
import { pathToFileURL } from "url";

const checkProof = (filePath: string): void => {
  try {
    const content = readFileSync(filePath, "utf-8");
    const result = runProofCheckerFromText(content);
    const issues = collectProofCheckerIssues(result);

    if (issues.length === 0) {
      console.log(`${basename(filePath)}: proof is correct`);
      return;
    }

    console.log(`${basename(filePath)}: proof has issues`);
    for (const issue of issues) {
      console.log(issue);
    }
    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${basename(filePath)}: ${message}`);
    process.exitCode = 1;
  }
};

export { checkProof };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const proofFile = process.argv[2];
  if (!proofFile) {
    console.log("Usage: npm run checkProof <proof-file>");
    process.exit(1);
  }
  checkProof(proofFile);
}
