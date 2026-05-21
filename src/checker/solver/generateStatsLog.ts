/**
 * Run: npx tsx src/checker/solver/generateStatsLog.ts
 * Writes src/checker/solver/solver-test-stats.log (mirrors solver.test.ts except last test).
 */
import * as fs from "fs";
import * as path from "path";
import { runProofCheckerFromText } from "../proofChecker";
import { stmtToString } from "../proofToString";
import { ProofObj } from "../types/checkerTypes";
import { solve } from "./solver";
import type { SolverAttempt, SolverResult } from "./types";

export const LOG_PATH = path.join(__dirname, "solver-test-stats.log");

export const TUTORIAL_TEST_NAME = "solves tutorial #1 from incomplete state";
export const S1C1_MISSING_STEPS_TEST_NAME =
  "solves incomplete s1c1 missing 3 steps";
export const S1C1_CANONICAL_TEST_NAME =
  "S1C1: completes a partial proof (first three rows fixed) to canonical proofText";

export const DEFAULT_DETAILED_LOG_ROWS = 100;

export const s1c1EmptyStepsProofText = `title: "S1C1 - Prove Segments Parallel"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[g_1] con_seg(AM,BM)
[g_2] con_seg(CM,DM)
-> para(AC,BD)

steps:
`;

export const s1c1CanonicalSolveOpts = {
  maxDepth: 4,
  maxPlans: 25_000,
  maxCandidatesPerStep: 1000,
  stopAfterFirstPlan: false,
  logBackwardChains: DEFAULT_DETAILED_LOG_ROWS,
} as const;

/** One row: reason; dependency statements (if any); conclusion */
export const formatAttemptLogRow = (
  attempt: SolverAttempt,
  proof: ProofObj,
): string => {
  const deps = attempt.refs.length
    ? attempt.refs
        .map((ref) => {
          const step = proof.steps.find((s) => s.stepNumber === ref);
          return step?.statement ? stmtToString(step.statement) : `@${ref}`;
        })
        .join(" | ")
    : "";
  const row = [
    attempt.passed ? "ok" : "fail",
    attempt.reason,
    deps,
    attempt.statement,
  ];
  return row.map((part) => part.replace(/\s+/g, " ").trim()).join(";");
};

export const buildForwardAttemptsSection = (
  testName: string,
  result: SolverResult,
  proof: ProofObj,
  maxRows = DEFAULT_DETAILED_LOG_ROWS,
): string => {
  const lines = [
    "",
    `--- ${testName}: first ${maxRows} forward step attempts ---`,
    "status;reason;dependencies;conclusion",
  ];
  const attempts = result.attempts.slice(0, maxRows);
  const lookupProof =
    result.status === "solved" ? result.checkedProof : proof;
  for (const attempt of attempts) {
    lines.push(formatAttemptLogRow(attempt, lookupProof));
  }
  if (result.attempts.length > maxRows) {
    lines.push(
      `... (${result.attempts.length - maxRows} more attempts omitted)`,
    );
  }
  return lines.join("\n");
};

export const buildBackwardChainsSection = (
  testName: string,
  result: SolverResult,
  maxRows = DEFAULT_DETAILED_LOG_ROWS,
): string => {
  const lines = [
    "",
    `--- ${testName}: first ${maxRows} backward reasoning chains ---`,
    "reason_chain;dependency_slots;conclusion",
  ];
  const chains = result.stats.backwardChains.slice(0, maxRows);
  for (const chain of chains) {
    lines.push(
      [chain.reasons, chain.dependencies, chain.conclusion]
        .map((part) => part.replace(/\s+/g, " ").trim())
        .join(";"),
    );
  }
  if (result.stats.backwardChains.length > maxRows) {
    lines.push(
      `... (${result.stats.backwardChains.length - maxRows} more chains omitted)`,
    );
  }
  return lines.join("\n");
};

/** @deprecated use buildForwardAttemptsSection */
export const buildTutorialAttemptsSection = (
  result: SolverResult,
  proof: ProofObj,
): string =>
  buildForwardAttemptsSection(TUTORIAL_TEST_NAME, result, proof);

/** @deprecated use buildBackwardChainsSection */
export const buildTutorialBackwardChainsSection = (
  result: SolverResult,
): string => buildBackwardChainsSection(TUTORIAL_TEST_NAME, result);

const defaultProofText = `
title: "solver reflex"
premises:
pt: A (0, 0, b), B (1, 0, b), C (0, 1, b)
-> con_seg(AC, AC)

steps:
[01] reflex_s() -> con_seg(AB, AB)
`;

const checkedProof = (proofText: string) => {
  const result = runProofCheckerFromText(proofText);
  if (result.graph.incorrectSteps.size !== 0) {
    throw new Error(`Invalid fixture: ${[...result.graph.incorrectSteps].join(", ")}`);
  }
  return result.proof;
};

export type StatsLogDetailed = {
  testName: string;
  result: SolverResult;
  proof: ProofObj;
  maxRows?: number;
};

export type StatsLogRow = {
  test: string;
  backwardReasonsTried: number | string;
  forwardStepAttempts: number | string;
  status: string;
  note: string;
  detailedLog?: StatsLogDetailed;
  /** @deprecated use detailedLog */
  tutorialResult?: SolverResult;
  /** @deprecated use detailedLog */
  tutorialProof?: ProofObj;
};

export const s1c1Missing3StepsProofText = `title: "S1C1 - Prove Segments Parallel"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[d_03] transversal(C, A, C, D, B, D)
[g_1] con_seg(AM,BM) 
[g_2] con_seg(CM,DM)
-> para(AC,BD)

steps:
[01] given(g_2) ->  con_seg(CM,DM)
[02] given(g_1) ->  con_seg(AM,BM) 
[03] vert_ang() -> con_ang(a_CMA, a_DMB)`;

const cases: Array<{ name: string; run: () => StatsLogRow }> = [
  {
    name: "solves a valid incomplete proof with BFS",
    run: () => {
      const res = solve(checkedProof(defaultProofText), { maxDepth: 1 });
      return {
        test: "solves a valid incomplete proof with BFS",
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
      };
    },
  },
  {
    name: "statement generation skips reversed duplicates",
    run: () => ({
      test: "statement generation skips reversed duplicates",
      backwardReasonsTried: "—",
      forwardStepAttempts: "—",
      status: "skipped",
      note: "no solve() call",
    }),
  },
  {
    name: "returns capped when the plan budget is exhausted",
    run: () => {
      const res = solve(checkedProof(defaultProofText), { maxPlans: 0 });
      return {
        test: "returns capped when the plan budget is exhausted",
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
      };
    },
  },
  {
    name: "solves incomplete s1c1",
    run: () => {
      const proofText = `title: "S1C1 - Prove Segments Parallel"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[d_03] transversal(C, A, C, D, B, D)
[g_1] con_seg(AM,BM) 
[g_2] con_seg(CM,DM)
-> para(AC,BD)

steps:
[01] given(g_2) ->  con_seg(CM,DM)
[02] given(g_1) ->  con_seg(AM,BM) 
[03] vert_ang() -> con_ang(a_CMA, a_DMB)
[04] sas(1, 3, 2) -> con_tri(t_ACM,t_BDM)`;
      const res = solve(checkedProof(proofText), { maxDepth: 2 });
      return {
        test: "solves incomplete s1c1",
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
      };
    },
  },
  {
    name: S1C1_MISSING_STEPS_TEST_NAME,
    run: () => {
      const proof = checkedProof(s1c1Missing3StepsProofText);
      const res = solve(proof, {
        maxDepth: 3,
        logBackwardChains: DEFAULT_DETAILED_LOG_ROWS,
      });
      return {
        test: S1C1_MISSING_STEPS_TEST_NAME,
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
        detailedLog: {
          testName: S1C1_MISSING_STEPS_TEST_NAME,
          result: res,
          proof,
        },
      };
    },
  },
  {
    name: S1C1_CANONICAL_TEST_NAME,
    run: () => {
      const proof = checkedProof(s1c1EmptyStepsProofText);
      const res = solve(proof, s1c1CanonicalSolveOpts);
      return {
        test: S1C1_CANONICAL_TEST_NAME,
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
        detailedLog: {
          testName: S1C1_CANONICAL_TEST_NAME,
          result: res,
          proof,
        },
      };
    },
  },
  {
    name: TUTORIAL_TEST_NAME,
    run: () => {
      const proofText = `title: "Tutorial #1 - Prove Triangles Congruent"
premises:
pt: A (5.5, 9, t), B (2, 3, l), C (5.5, 1, b), D (9, 3, r)
tri: t_ABC t_ADC
[g_1] con_seg(AB,AD)
[g_2] con_ang(a_BAC,a_DAC) 
-> con_tri(t_ABC,t_ADC)`;
      const proof = checkedProof(proofText);
      const res = solve(proof, {
        maxDepth: 4,
        logBackwardChains: DEFAULT_DETAILED_LOG_ROWS,
      });
      return {
        test: TUTORIAL_TEST_NAME,
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
        detailedLog: {
          testName: TUTORIAL_TEST_NAME,
          result: res,
          proof,
        },
      };
    },
  },
];

const resolveDetailedLog = (row: StatsLogRow): StatsLogDetailed | undefined => {
  if (row.detailedLog) return row.detailedLog;
  if (row.tutorialResult && row.tutorialProof) {
    return {
      testName: row.test,
      result: row.tutorialResult,
      proof: row.tutorialProof,
    };
  }
  return undefined;
};

export const buildDetailedLogSections = (row: StatsLogRow): string => {
  const detailed = resolveDetailedLog(row);
  if (!detailed) return "";
  const maxRows = detailed.maxRows ?? DEFAULT_DETAILED_LOG_ROWS;
  return `${buildBackwardChainsSection(detailed.testName, detailed.result, maxRows)}${buildForwardAttemptsSection(detailed.testName, detailed.result, detailed.proof, maxRows)}`;
};

/** Stats + backward/forward detail sections for a single proof run. */
export const buildSingleProofReport = (
  testName: string,
  row: StatsLogRow,
  extras?: { premisesText?: string; proofText?: string; sourcePath?: string },
): string => {
  const sections: string[] = [];
  if (extras?.sourcePath) {
    sections.push(`source: ${extras.sourcePath}`);
  }
  if (extras?.premisesText) {
    sections.push(
      "--- premises (solver input) ---",
      extras.premisesText.trimEnd(),
      "",
    );
  }
  sections.push(buildStatsLogBody([{ ...row, test: testName }]).trimEnd());
  if (extras?.proofText) {
    sections.push("", "--- final proof ---", extras.proofText.trimEnd(), "");
  }
  return `${sections.join("\n")}\n`;
};

export const buildStatsLogBody = (rows: StatsLogRow[]): string => {
  const header = [
    "test",
    "backward_reasons_tried",
    "forward_step_attempts",
    "status",
    "note",
  ].join("\t");

  const table = [
    header,
    ...rows.map((r) =>
      [
        r.test,
        String(r.backwardReasonsTried),
        String(r.forwardStepAttempts),
        r.status,
        r.note,
      ].join("\t"),
    ),
  ].join("\n");

  const detailSections = rows.map(buildDetailedLogSections).join("");

  return `${table}${detailSections}\n`;
};

/** Run solver fixtures and write solver-test-stats.log (CLI only, not on import). */
export const runGenerateStatsLogMain = (): void => {
  const rows: StatsLogRow[] = [];
  for (const { name, run } of cases) {
    const started = Date.now();
    process.stderr.write(`running: ${name}...\n`);
    try {
      const row = run();
      row.note = row.note
        ? `${row.note}; ${Date.now() - started}ms`
        : `${Date.now() - started}ms`;
      rows.push(row);
      process.stderr.write(
        `  -> ${row.status} backward=${row.backwardReasonsTried} forward=${row.forwardStepAttempts} (${Date.now() - started}ms)\n`,
      );
    } catch (err) {
      rows.push({
        test: name,
        backwardReasonsTried: "—",
        forwardStepAttempts: "—",
        status: "error",
        note: `${err instanceof Error ? err.message : String(err)}; ${Date.now() - started}ms`,
      });
    }
  }

  fs.writeFileSync(LOG_PATH, buildStatsLogBody(rows), "utf8");
  console.log(`Wrote ${LOG_PATH}`);
};

if (process.argv[1]?.includes("generateStatsLog")) {
  runGenerateStatsLogMain();
}
