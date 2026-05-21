import { buildPremises } from "../premises";
import { runProofCheckerFromText } from "../../proofChecker";

const overlapPremises = `title: "Overlapping triangle congruence"
premises:
pt: E (2, 9, l), F (4.92, 5.5, bl), G (7, 3, b), H (9.08, 5.5, br), D (12, 9, r)
tri: t_EHG t_DFG
ang: a_EGD
[d_1] on_line(ED, F)
[d_2] on_line(DG, H)
[g_1] con_seg(EG,DG)
[g_2] con_ang(a_GEH,a_FDG)
-> con_seg(FG, HG)

steps:`;

test("overlap: reflex_a and asa with a_EGD resolve to interior angles", () => {
  const text = `${overlapPremises}
[01] given(g_1) -> con_seg(EG,DG)
[02] given(g_2) -> con_ang(a_GEH,a_FDG)
[03] reflex_a() -> con_ang(a_EGD,a_EGD)
[04] asa(2,1,3) -> con_tri(t_EHG,t_DFG)
[05] cpctc(4) -> con_seg(FG,HG)
`;
  const res = runProofCheckerFromText(text);
  expect([...res.graph.incorrectSteps]).toEqual([]);
});

test("s1c1: cpctc may conclude overlapping angle labels at A", () => {
  const text = `title: S1C1
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
[01] given(g_2) -> con_seg(CM,DM)
[02] given(g_1) -> con_seg(AM,BM)
[03] vert_ang() -> con_ang(a_CMA, a_DMB)
[04] sas(1, 3, 2) -> con_tri(t_ACM,t_BDM)
[05] cpctc(4) -> con_ang(a_CAB, a_DBC)
`;
  const res = runProofCheckerFromText(text);
  expect([...res.graph.incorrectSteps]).toEqual([]);
});

test("resolveCongruentAng maps g_2 and reflex_a to per-triangle interior labels", () => {
  const text = `${overlapPremises}
steps:
[01] given(g_1) -> con_seg(EG,DG)
[02] given(g_2) -> con_ang(a_GEH,a_FDG)
[03] reflex_a() -> con_ang(a_EGD,a_EGD)
`;
  const res = runProofCheckerFromText(text);
  const ctx = buildPremises(res.proof);
  const tri1 = ctx.addTriangleFromStr("EHG");
  const tri2 = ctx.addTriangleFromStr("DFG");
  const g2 = res.proof.steps.find((s) => s.stepNumber === "2")!.statement!;
  const reflex = res.proof.steps.find((s) => s.stepNumber === "3")!.statement!;
  expect(
    ctx
      .resolveCongruentAngForTriangles(g2, tri1, tri2)
      .arguments.map((a) => a.v),
  ).toEqual(["HEG", "FDG"]);
  expect(
    ctx
      .resolveCongruentAngForTriangles(reflex, tri1, tri2)
      .arguments.map((a) => a.v),
  ).toEqual(["EGH", "DGF"]);
});

test("ProofContent.angleLabelsOverlap links premise angle to triangle interior", () => {
  const proof = runProofCheckerFromText(overlapPremises).proof;
  const ctx = buildPremises(proof);
  const tri = ctx.getTriangle("EHG")!;
  const interiorAtG = tri.a.find((a) => a.center.label === "G")!;
  expect(ctx.angleLabelsOverlap("a_EGD", interiorAtG.label)).toBe(true);
  expect(ctx.interiorAngleLabelForTriangle(tri, "a_EGD")).toBe(
    `a_${interiorAtG.label}`,
  );
});
