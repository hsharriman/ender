import { readFileSync } from "fs";
import { basename } from "path";
import { ProofParser } from "./grammar/lezerParser";
import { collectProofCheckerIssues, runProofChecker } from "./proofChecker";
import { ProofObj } from "./types/checkerTypes";

const parseProof = (filePath: string): ProofObj => {
  const content = readFileSync(filePath, "utf-8");
  const parser = new ProofParser();
  return parser.parse(content) as unknown as ProofObj;
};

const checkProof = (filePath: string): void => {
  try {
    const proof = parseProof(filePath);
    const result = runProofChecker(proof);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const proofFile = process.argv[2];
  if (!proofFile) {
    console.log("Usage: npm run checkProof <proof-file>");
    process.exit(1);
  }
  checkProof(proofFile);
}
