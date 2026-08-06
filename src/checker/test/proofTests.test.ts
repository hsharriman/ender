import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";
import { presentationToProofObj } from "../verified/presentationAdapter";
import {
  checkVerifiedProofNode,
  checkVerifiedReportNode,
  parsePresentationNode,
} from "../verified/nodeWasmLoader";
import { presentationContent } from "../../interface/core/grammarToLayout/presentationContent";
import {
  buildAnnotatedLines,
  summarizeReport,
} from "../../interface/core/reportAnnotations";
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
  "circles/con_chords_intersect_arcs_correct.txt",
  "circles/con_chords_intersect_arcs_incorrect.txt",
  "circles/def_radius_correct.txt",
  "circles/def_radius_incorrect.txt",
  "circles/inscribed_semi_correct.txt",
  "circles/inscribed_semi_incorrect.txt",
  "circles/tangent_perp_correct.txt",
  "circles/tangent_perp_incorrect.txt",
  "examples/goal_reversed_correct.txt",
  "examples/goal_reversed_incorrect.txt",
  "examples/overlap.txt",
  "examples/s1c1.txt",
  "examples/s1c1incomplete.txt",
  "examples/s1c2.txt",
  "examples/s1inc1.txt",
  "examples/s1inc2.txt",
  "examples/s2c2incomplete.txt",
  "examples/transversal_altext.txt",
  "examples/transversal_corresp.txt",
  "examples/transversal_sameside.txt",
  "examples/tutinc.txt",
  "examples/tutorial.txt",
  "examples/z_figure.txt",
  "examples/z_figure_incorrect.txt",
  "lines_angles/altext_correct.txt",
  "lines_angles/altext_incorrect.txt",
  "lines_angles/altint_conv_correct.txt",
  "lines_angles/altint_conv_incorrect.txt",
  "lines_angles/altint_correct.txt",
  "lines_angles/altint_incorrect.txt",
  "lines_angles/ang_bisect_conv_correct.txt",
  "lines_angles/ang_bisect_conv_incorrect.txt",
  "lines_angles/con_ang_transitive_correct.txt",
  "lines_angles/con_ang_transitive_incorrect.txt",
  "lines_angles/con_complements_correct.txt",
  "lines_angles/con_complements_incorrect.txt",
  "lines_angles/con_complements_same_correct.txt",
  "lines_angles/con_complements_same_incorrect.txt",
  "lines_angles/con_seg_transitive_correct.txt",
  "lines_angles/con_seg_transitive_incorrect.txt",
  "lines_angles/con_supplements_correct.txt",
  "lines_angles/con_supplements_incorrect.txt",
  "lines_angles/con_supplements_same_correct.txt",
  "lines_angles/con_supplements_same_incorrect.txt",
  "lines_angles/corresp_ang_correct.txt",
  "lines_angles/corresp_ang_incorrect.txt",
  "lines_angles/def_con_right_incorrect.txt",
  "lines_angles/linear_pair_correct.txt",
  "lines_angles/linear_pair_incorrect.txt",
  "lines_angles/para_transitive_correct.txt",
  "lines_angles/para_transitive_incorrect.txt",
  "lines_angles/perp_con_ang_correct.txt",
  "lines_angles/perp_con_ang_incorrect.txt",
  "lines_angles/sameside_ang_correct.txt",
  "lines_angles/sameside_ang_incorrect.txt",
  "quadrilaterals/def_parallelogram_correct.txt",
  "quadrilaterals/def_parallelogram_incorrect.txt",
  "quadrilaterals/pgram_consec_angs_correct.txt",
  "quadrilaterals/pgram_consec_angs_incorrect.txt",
  "quadrilaterals/pgram_opp_angs_correct.txt",
  "quadrilaterals/pgram_opp_angs_incorrect.txt",
  "quadrilaterals/pgram_opp_side_para_correct.txt",
  "quadrilaterals/pgram_opp_side_para_incorrect.txt",
  "quadrilaterals/pgram_opp_sides_correct.txt",
  "quadrilaterals/pgram_opp_sides_incorrect.txt",
  "quadrilaterals/rect_diag_con_correct.txt",
  "quadrilaterals/rect_diag_con_incorrect.txt",
  "quadrilaterals/rectangle_def_correct.txt",
  "quadrilaterals/rectangle_def_incorrect.txt",
  "quadrilaterals/rectangle_pgram_correct.txt",
  "quadrilaterals/rectangle_pgram_incorrect.txt",
  "quadrilaterals/rhombus_consec_sides_correct.txt",
  "quadrilaterals/rhombus_consec_sides_incorrect.txt",
  "quadrilaterals/rhombus_def_correct.txt",
  "quadrilaterals/rhombus_def_incorrect.txt",
  "quadrilaterals/rhombus_opp_bisect_correct.txt",
  "quadrilaterals/rhombus_opp_bisect_incorrect.txt",
  "quadrilaterals/rhombus_pgram_correct.txt",
  "quadrilaterals/rhombus_pgram_incorrect.txt",
  "triangles/base_angle_conv_correct.txt",
  "triangles/base_angle_conv_incorrect.txt",
  "triangles/base_angle_correct.txt",
  "triangles/base_angle_incorrect.txt",
  "triangles/con_tri_transitive_correct.txt",
  "triangles/con_tri_transitive_incorrect.txt",
  "triangles/def_con_tri_correct.txt",
  "triangles/def_con_tri_incorrect.txt",
  "triangles/def_equiangular_correct.txt",
  "triangles/def_equiangular_incorrect.txt",
  "triangles/def_equilateral_correct.txt",
  "triangles/def_equilateral_incorrect.txt",
  "triangles/equiang_equilat_correct.txt",
  "triangles/equiang_equilat_incorrect.txt",
  "triangles/equilat_equiang_correct.txt",
  "triangles/equilat_equiang_incorrect.txt",
  "triangles/third_angle_correct.txt",
  "triangles/third_angle_incorrect.txt",
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

  test("reports each step of an accepted proof", async () => {
    const source = readFileSync(join(PROOFS_DIR, "examples/tutorial.txt"), "utf8");
    const report = await checkVerifiedReportNode(source);
    expect(report.steps.map((step) => step.status)).toEqual([
      "accepted",
      "accepted",
      "accepted",
      "accepted",
    ]);
    expect(report.steps[3]).toEqual(
      expect.objectContaining({
        number: 4,
        reason: "sas",
        conclusion: "con_tri(t_ABC,t_ADC)",
        dependencies: [1, 2, 3],
      }),
    );
    expect(report.steps[0].source).toContain("given(g_1)");
    // The dependency graph is acyclic by construction: a step can only cite
    // facts proved before it.
    expect(report.graph).toEqual({
      nodes: [1, 2, 3, 4],
      edges: [
        [1, 4],
        [2, 4],
        [3, 4],
      ],
      cycles: [],
      unusedSteps: [],
    });
    expect(report.goal.provedBy).toBe(4);
    // Citing a premise with `given` is not a second derivation of it.
    expect(report.duplicates).toEqual([]);
  });

  test("blames one step and blocks nothing after it", async () => {
    const source = readFileSync(join(PROOFS_DIR, "examples/tutinc.txt"), "utf8");
    const report = await checkVerifiedReportNode(source);
    expect(report.verdict).toBe("rejected_proof");
    expect(report.steps.map((step) => step.status)).toEqual([
      "accepted",
      "accepted",
      "accepted",
      "rejected",
    ]);
    expect(report.steps[3].diagnostics.length).toBeGreaterThan(0);
    // The goal is stated by the rejected step, so nothing proved it, but it is
    // not a stray step either.
    expect(report.goal.provedBy).toBeNull();
    expect(report.graph.unusedSteps).toEqual([]);
  });

  test("summarizes a report the way the harness shows it", async () => {
    const accepted = await checkVerifiedReportNode(
      readFileSync(join(PROOFS_DIR, "examples/tutorial.txt"), "utf8"),
    );
    expect(summarizeReport(accepted)).toBe(
      "Accepted by the verified checker. (goal reached at step 4)",
    );

    const rejected = await checkVerifiedReportNode(
      readFileSync(join(PROOFS_DIR, "examples/tutinc.txt"), "utf8"),
    );
    expect(summarizeReport(rejected)).toBe(
      "Rejected by the verified checker. (first failure at step 4)",
    );
  });

  test("marks the failed step and only the failed step", async () => {
    const source = readFileSync(join(PROOFS_DIR, "examples/tutinc.txt"), "utf8");
    const report = await checkVerifiedReportNode(source);
    const unaccepted = new Map(
      report.steps
        .filter((step) => step.status !== "accepted")
        .map((step) => [String(step.number), step] as const),
    );
    const marked = buildAnnotatedLines(source, unaccepted)
      .filter((line) => line.status !== undefined)
      .map((line) => [line.text.trim().slice(0, 4), line.status]);
    expect(marked).toEqual([["[04]", "rejected"]]);
  });

  test("reports a fact derived twice", async () => {
    const source = readFileSync(
      join(PROOFS_DIR, "examples/s1c1_dupe_stmts.txt"),
      "utf8",
    );
    const report = await checkVerifiedReportNode(source);
    expect(report.duplicates).toHaveLength(1);
    expect(report.duplicates[0]).toEqual({
      statement: "con_ang(a_AMC,a_DMB)",
      first: { kind: "step", step: 3 },
      again: { kind: "step", step: 5 },
    });
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
