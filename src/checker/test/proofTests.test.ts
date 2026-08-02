import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";
import { presentationToProofObj } from "../verified/presentationAdapter";
import {
  checkVerifiedProofNode,
  checkVerifiedReportNode,
  parsePresentationNode,
} from "../verified/nodeWasmLoader";
import { presentationContent } from "../../interface/core/grammarToLayout/presentationContent";
import { VerifiedCheckOutput } from "../verified/presentationTypes";

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

const proofFiles = collectTxtFiles(PROOFS_DIR);

type Expected =
  | { kind: "pass" }
  | { kind: "fail"; step: string }
  | { kind: "incomplete" };

/**
 * Parse the first line of a proof file, which records the outcome the corpus
 * author intended:
 *   // pass
 *   // fail on step N
 *   // fail incomplete
 */
function parseExpected(firstLine: string): Expected | null {
  const trimmed = firstLine.trim();
  if (trimmed === "// pass") return { kind: "pass" };
  if (trimmed === "// fail incomplete") return { kind: "incomplete" };
  const failMatch = trimmed.match(/^\/\/ fail on step (\d+)$/);
  return failMatch ? { kind: "fail", step: failMatch[1] } : null;
}

/**
 * Files whose intended outcome the verified kernel can already reproduce.  The
 * rest of the corpus needs reasons or statements that are still fail-closed,
 * and a fail-closed rejection is not evidence of anything, so asserting on it
 * would only lock in today's gaps.  Move a file here once it is in scope; a
 * file that leaves this list is a regression.
 */
const OUTCOME_ENFORCED = new Set([
  "examples/s1inc1.txt",
  "examples/s1inc2.txt",
  "examples/tutinc.txt",
  "examples/tutorial.txt",
  "lines_angles/con_ang_transitive_correct.txt",
  "lines_angles/con_ang_transitive_incorrect.txt",
  "lines_angles/con_seg_transitive_correct.txt",
  "lines_angles/con_seg_transitive_incorrect.txt",
  "lines_angles/def_con_right_incorrect.txt",
  "lines_angles/perp_con_ang_correct.txt",
  "lines_angles/perp_con_ang_incorrect.txt",
  "triangles/con_tri_transitive_correct.txt",
  "triangles/con_tri_transitive_incorrect.txt",
]);

const stepsBlamedBy = (report: VerifiedCheckOutput): string[] => {
  const issues = "issues" in report ? report.issues : report.errors;
  return issues.flatMap((issue) => {
    const steps = (issue.details as { steps?: unknown } | undefined)?.steps;
    return Array.isArray(steps) ? (steps as string[]) : [];
  });
};

describe("intended corpus outcomes", () => {
  const enforced = proofFiles.filter((file) =>
    OUTCOME_ENFORCED.has(relative(PROOFS_DIR, file).split(sep).join("/")),
  );

  test("every enforced file exists", () => {
    expect(enforced).toHaveLength(OUTCOME_ENFORCED.size);
  });

  test.each(enforced)("%s", async (filePath) => {
    const text = readFileSync(filePath, "utf-8");
    const expected = parseExpected(text.split("\n")[0]);
    if (!expected) throw new Error("missing outcome comment");
    const report = await checkVerifiedProofNode(text);

    if (expected.kind === "pass") {
      expect(report.isCorrect).toBe(true);
      return;
    }
    expect(report.isCorrect).toBe(false);
    if (expected.kind === "fail") {
      // The kernel must blame the step the corpus author blamed, not merely
      // reject the proof somewhere.
      expect(stepsBlamedBy(report)).toContain(expected.step);
    }
  });
});

describe("extracted Rocq API corpus tests", () => {
  test.each(proofFiles)("%s", async (filePath) => {
    const text = readFileSync(filePath, "utf-8");
    const [presentation, report] = await Promise.all([
      parsePresentationNode(text),
      checkVerifiedProofNode(text),
    ]);
    expect(typeof report.isCorrect).toBe("boolean");
    expect("issues" in report ? report.issues : report.errors).toBeInstanceOf(
      Array,
    );

    // Rocq preserves arc literals such as BR_OB, but the legacy TypeScript
    // geometry object model has no Arc variant.  Its former parser silently
    // split these literals.  Keep testing successful Rocq parsing here while
    // refusing to reproduce that lossy behavior in the compatibility adapter.
    if (/[A-Z]{2}_[A-Z]{2}/.test(text)) {
      expect(() => presentationToProofObj(presentation)).toThrow(
        "Unsupported presentation object",
      );
      return;
    }
    const proof = presentationToProofObj(presentation);
    expect(proof.steps).toHaveLength(
      presentation.givens.length + presentation.steps.length,
    );
    expect(presentationContent(proof)).toBeDefined();
  });

  test("exports every audited rich-report field", async () => {
    const source = readFileSync(join(PROOFS_DIR, "examples/tutorial.txt"), "utf8");
    const report = await checkVerifiedReportNode(source);
    expect(report.verdict).toBe("accepted");
    expect(report.problem?.conclusion).toBe("con_tri(t_ABC,t_ADC)");
    expect(report.presentation?.steps.length).toBeGreaterThan(0);
    expect(report).toEqual(
      expect.objectContaining({
        steps: expect.any(Array),
        graph: expect.any(Object),
        duplicates: expect.any(Array),
        goal: expect.any(Object),
        issues: expect.any(Array),
        errors: expect.any(Array),
        diagnostics: expect.any(Array),
      }),
    );
  });

  test("coverage manifest contains every catalogued reason", () => {
    const catalog = readFileSync(
      join(__dirname, "../grammar/defs/reasons.defs.ts"),
      "utf8",
    );
    const reasons = [
      ...catalog.matchAll(/^  ([a-zA-Z0-9_]+): \{/gm),
    ].map((match) => match[1]);
    const manifest = JSON.parse(
      readFileSync(join(__dirname, "../../../docs/reason-coverage.json"), "utf8"),
    ) as { entries: Array<{ reason: string }> };
    expect(manifest.entries.map(({ reason }) => reason)).toEqual(reasons);
    expect(reasons).toHaveLength(92);
  });
});
