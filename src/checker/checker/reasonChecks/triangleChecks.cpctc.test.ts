import { Obj } from "../../../geometry-object";
import { buildPremises } from "../premises";
import { runProofCheckerFromText } from "../../proofChecker";
import { cpctcCorrespondingConclusions } from "./triangleChecks";

const s1c1WithTri = `title: S1C1
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[g_1] con_seg(AM,BM)
[g_2] con_seg(CM,DM)
-> para(AC,BD)

steps:
[01] given(g_2) -> con_seg(CM,DM)
[02] given(g_1) -> con_seg(AM,BM)
[03] vert_ang() -> con_ang(a_CMA, a_DMB)
[04] sas(1, 3, 2) -> con_tri(t_ACM,t_BDM)`;

test("cpctcCorrespondingConclusions yields three angle pairs by triangle index", () => {
  const proof = runProofCheckerFromText(s1c1WithTri).proof;
  const conTri = proof.steps.find((s) => s.stepNumber === "4")!.statement!;
  const ctx = buildPremises(proof);
  const angles = cpctcCorrespondingConclusions(conTri, "con_ang", ctx);
  expect(angles).toHaveLength(3);
  angles.forEach((stmt) => {
    expect(stmt.function).toBe("con_ang");
    expect(stmt.arguments[0].type).toBe(Obj.Angle);
    expect(stmt.arguments[1].type).toBe(Obj.Angle);
  });
  expect(angles.map((s) => s.arguments.map((a) => a.v).join("/"))).toContain(
    "CAM/DBM",
  );
});

test("cpctcCorrespondingConclusions yields three segment pairs by triangle index", () => {
  const proof = runProofCheckerFromText(s1c1WithTri).proof;
  const conTri = proof.steps.find((s) => s.stepNumber === "4")!.statement!;
  const ctx = buildPremises(proof);
  const segs = cpctcCorrespondingConclusions(conTri, "con_seg", ctx);
  expect(segs).toHaveLength(3);
  segs.forEach((stmt) => {
    expect(stmt.function).toBe("con_seg");
    expect(stmt.arguments[0].type).toBe(Obj.Segment);
    expect(stmt.arguments[1].type).toBe(Obj.Segment);
  });
});
