import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { buildPremises } from "../checker/premises";
import { loadStatementDefinitions } from "../grammar/defsParsers";
import { runProofCheckerFromText } from "../proofChecker";
import { proofToString } from "../proofToString";
import { __solverTest, solve } from "./solver";

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
  expect(result.graph.incorrectSteps.size).toBe(0);
  return result.proof;
};

const sameArg = (ctx: ProofContent, actual: ParseObj, expected: ParseObj) => {
  if (actual.type !== expected.type) return false;
  if (actual.type === Obj.Angle)
    return ctx.getAngle(expected.v)?.matches(actual.v);
  if (actual.type === Obj.Segment)
    return ctx.getSegment(expected.v)?.matches(actual.v);
  if (actual.type === Obj.Triangle)
    return ctx.getTriangle(expected.v)?.matches(actual.v);
  if (actual.type === Obj.Quadrilateral)
    return ctx.getQuadrilateral(expected.v)?.matches(actual.v);
  return actual.v === expected.v;
};

const sameStmt = (
  proofText: string,
  actual: { function: string; arguments: ParseObj[] },
  expected: { function: string; arguments: ParseObj[] },
) => {
  if (
    actual.function !== expected.function ||
    actual.arguments.length !== expected.arguments.length
  )
    return false;
  const ctx = buildPremises(checkedProof(proofText));
  const direct = actual.arguments.every((arg, idx) =>
    sameArg(ctx, arg, expected.arguments[idx]),
  );
  if (direct) return true;
  return (
    actual.arguments.length === 2 &&
    actual.arguments[0].type === actual.arguments[1].type &&
    sameArg(ctx, actual.arguments[0], expected.arguments[1]) &&
    sameArg(ctx, actual.arguments[1], expected.arguments[0])
  );
};

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("solves a valid incomplete proof with BFS", () => {
  const proof = checkedProof(defaultProofText);
  const res = solve(proof, { maxDepth: 1 });
  expect(res.status).toBe("solved");
  if (res.status !== "solved") return;
  expect(res.steps).toHaveLength(1);
  expect(res.steps[0].statement).toEqual(proof.goal);
  expect(res.dagText).toContain("reflex_s");
  expect(res.dagText).toContain("con_seg(AC, AC)");
  const roundTrip = runProofCheckerFromText(proofToString(res.checkedProof));
  expect(roundTrip.graph.incorrectSteps.size).toBe(0);
  expect(roundTrip.goalMatchResult.matches).toBe(true);
});

test("statement generation skips reversed duplicates", () => {
  const ctx = buildPremises(checkedProof(defaultProofText));
  const pool = __solverTest.objectPool(ctx);
  const defs = loadStatementDefinitions().statements;
  const stmts = __solverTest.statementsFor("con_seg", defs, pool);

  expect(stmts).toHaveLength(6);
  expect(
    stmts.some((s) => s.arguments[0].v === "AC" && s.arguments[1].v === "AB"),
  ).toBe(false);
});

test("returns capped when the state budget is exhausted", () => {
  const res = solve(checkedProof(defaultProofText), {
    maxStates: 0,
  });
  expect(res.status).toBe("capped");
});

test("solves incomplete s1c1", () => {
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
  const proof = checkedProof(proofText);
  const res = solve(proof, { maxDepth: 2 });
  expect(res.status).toBe("solved");
  if (res.status !== "solved") return;
  expect(res.steps).toHaveLength(2);
  expect(res.steps[0].reason).toEqual({
    function: "cpctc",
    arguments: ["4"],
  });
  expect(res.steps[1].reason).toEqual({
    function: "altint_conv",
    arguments: ["5"],
  });
  expect(res.steps[res.steps.length - 1].statement).toEqual(proof.goal);
  expect(
    sameStmt(proofText, res.steps[0].statement!, {
      function: "con_ang",
      arguments: [
        { type: Obj.Angle, v: "ACM" },
        { type: Obj.Angle, v: "BDM" },
      ],
    }),
  ).toBe(true);
  expect(res.dagText).toContain("altint_conv");
  expect(res.dagText).toContain("para");
});

test("solves incomplete s1c1 missing 3 steps", () => {
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
[03] vert_ang() -> con_ang(a_CMA, a_DMB)`;
  const proof = checkedProof(proofText);
  const res = solve(proof, { maxDepth: 3 });
  expect(res.status).toBe("solved");
  if (res.status !== "solved") return;
  expect(res.steps).toHaveLength(3);
  expect(res.steps[0].reason).toEqual({
    function: "sas",
    arguments: ["1", "3", "2"],
  });
  expect(res.steps[1].reason).toEqual({
    function: "cpctc",
    arguments: ["4"],
  });
  expect(res.steps[2].reason).toEqual({
    function: "altint_conv",
    arguments: ["5"],
  });
  expect(res.steps[res.steps.length - 1].statement).toEqual(proof.goal);
  expect(res.dagText).toContain("sas");
  expect(res.dagText).toContain("con_tri");
  expect(
    sameStmt(proofText, res.steps[1].statement!, {
      function: "con_ang",
      arguments: [
        { type: Obj.Angle, v: "ACM" },
        { type: Obj.Angle, v: "BDM" },
      ],
    }),
  ).toBe(true);
  expect(res.dagText).toContain("altint_conv");
});

test("solves tutorial #1 from incomplete state", () => {
  const proofText = `title: "Tutorial #1 - Prove Triangles Congruent"
premises:
pt: A (5.5, 9, t), B (2, 3, l), C (5.5, 1, b), D (9, 3, r)
tri: t_ABC t_ADC
[g_1] con_seg(AB,AD)
[g_2] con_ang(a_BAC,a_DAC) 
-> con_tri(t_ABC,t_ADC)`;
  const proof = checkedProof(proofText);
  const res = solve(proof, { maxDepth: 4 });
  expect(res.status).toBe("solved");
  if (res.status !== "solved") return;
  expect(res.steps).toHaveLength(4);
  expect(res.steps[0].reason).toEqual({
    function: "given",
    arguments: ["g_1"],
  });
  expect(res.steps[1].reason).toEqual({
    function: "given",
    arguments: ["g_2"],
  });
  expect(res.steps[2].reason).toEqual({
    function: "reflex_s",
    arguments: [],
  });
  expect(
    sameStmt(proofText, res.steps[2].statement!, {
      function: "con_seg",
      arguments: [
        { type: Obj.Segment, v: "AC" },
        { type: Obj.Segment, v: "AC" },
      ],
    }),
  ).toBe(true);
  expect(res.steps[3].reason).toEqual({
    function: "sas",
    arguments: ["1", "2", "3"],
  });
  expect(res.steps[res.steps.length - 1].statement).toEqual(proof.goal);
  expect(
    sameStmt(proofText, res.steps[3].statement!, {
      function: "con_tri",
      arguments: [
        { type: Obj.Triangle, v: "ABC" },
        { type: Obj.Triangle, v: "ADC" },
      ],
    }),
  ).toBe(true);
});
