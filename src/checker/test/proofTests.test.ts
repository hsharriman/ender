import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { presentationToProofObj } from "../verified/presentationAdapter";
import {
  checkVerifiedProofNode,
  checkVerifiedReportNode,
  parsePresentationNode,
} from "../verified/nodeWasmLoader";
import { presentationContent } from "../../interface/core/grammarToLayout/presentationContent";

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
