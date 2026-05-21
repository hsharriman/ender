import * as fs from "fs";
import {
  buildStatsLogBody,
  LOG_PATH,
  S1C1_MISSING_STEPS_TEST_NAME,
  type StatsLogRow,
} from "./generateStatsLog";
import { runProofCheckerFromText } from "../proofChecker";
import { solve } from "./solver";
import { s1c1Missing3StepsProofText } from "./generateStatsLog";

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
    throw new Error(`Invalid proof fixture: ${result.graph.incorrectSteps}`);
  }
  return result.proof;
};

const cases: Array<{
  name: string;
  run: () => StatsLogRow;
}> = [
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
        logBackwardChains: 100,
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
    name: "solves tutorial #1 from incomplete state",
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
        logBackwardChains: 100,
      });
      return {
        test: "solves tutorial #1 from incomplete state",
        backwardReasonsTried: res.stats.backwardReasonsTried,
        forwardStepAttempts: res.stats.forwardStepAttempts,
        status: res.status,
        note: "",
        detailedLog: {
          testName: "solves tutorial #1 from incomplete state",
          result: res,
          proof,
        },
      };
    },
  },
];

test("writes solver-test-stats.log (skips last test in solver.test.ts)", () => {
  const rows: StatsLogRow[] = [];

  for (const { name, run } of cases) {
    const started = Date.now();
    let row: StatsLogRow;
    try {
      row = run();
      row.test = name;
    } catch (err) {
      row = {
        test: name,
        backwardReasonsTried: "—",
        forwardStepAttempts: "—",
        status: "error",
        note: err instanceof Error ? err.message : String(err),
      };
    }
    row.note = row.note
      ? `${row.note}; ${Date.now() - started}ms`
      : `${Date.now() - started}ms`;
    rows.push(row);
  }

  fs.writeFileSync(LOG_PATH, buildStatsLogBody(rows), "utf8");
  expect(fs.existsSync(LOG_PATH)).toBe(true);

  const log = fs.readFileSync(LOG_PATH, "utf8");
  expect(log).toContain("reason_chain;dependency_slots;conclusion");
  expect(log).toContain("reason;dependencies;conclusion");

  const s1c1Row = rows.find((r) => r.test === S1C1_MISSING_STEPS_TEST_NAME);
  expect(s1c1Row?.detailedLog?.result.attempts.length).toBeGreaterThan(0);
  expect(
    s1c1Row?.detailedLog?.result.stats.backwardChains.length,
  ).toBeGreaterThan(0);
  expect(log).toContain(
    `--- ${S1C1_MISSING_STEPS_TEST_NAME}: first 100 backward reasoning chains ---`,
  );
  expect(log).toContain(
    `--- ${S1C1_MISSING_STEPS_TEST_NAME}: first 100 forward step attempts ---`,
  );

  const tutorialRow = rows.find(
    (r) => r.test === "solves tutorial #1 from incomplete state",
  );
  expect(tutorialRow?.detailedLog?.result.attempts.length).toBeGreaterThan(0);
  expect(
    tutorialRow?.detailedLog?.result.stats.backwardChains.length,
  ).toBeGreaterThan(0);
}, 180_000);
