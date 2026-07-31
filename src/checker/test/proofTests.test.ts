import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import {
  collectProofCheckerIssues,
  runProofCheckerFromText,
} from "../proofChecker";

const PROOFS_DIR = join(__dirname, "../proofs");

/** Recursively collect all .txt files under a directory. */
function collectTxtFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTxtFiles(full));
    } else if (entry.endsWith(".txt")) {
      results.push(full);
    }
  }
  return results;
}

type Expected =
  | { kind: "pass" }
  | { kind: "fail"; step: string }
  | { kind: "incomplete" };

/**
 * Parse the first line of a proof test file to determine the expected outcome.
 * Supported formats:
 *   // pass
 *   // fail on step N   (N is the step number without leading zeros, e.g. "3")
 *   // fail incomplete  (the proof is well-formed but never reaches its goal)
 */
function parseExpected(firstLine: string): Expected {
  const trimmed = firstLine.trim();
  if (trimmed === "// pass") return { kind: "pass" };
  if (trimmed === "// fail incomplete") return { kind: "incomplete" };
  const failMatch = trimmed.match(/^\/\/ fail on step (\d+)$/);
  if (failMatch) return { kind: "fail", step: failMatch[1] };
  throw new Error(`Unrecognised expectation comment: "${trimmed}"`);
}

const proofFiles = collectTxtFiles(PROOFS_DIR);

describe("proof checker regression tests", () => {
  test.each(proofFiles)("%s", (filePath) => {
    const text = readFileSync(filePath, "utf-8");
    const firstLine = text.split("\n")[0];
    const expected = parseExpected(firstLine);
    const result = runProofCheckerFromText(text);

    if (expected.kind === "pass") {
      const issues = collectProofCheckerIssues(result);
      expect(issues).toHaveLength(0);
    } else if (expected.kind === "incomplete") {
      expect(result.goalMatchResult.matches).toBe(false);
    } else {
      expect(result.graph.incorrectSteps.has(expected.step)).toBe(true);
    }
  });
});
