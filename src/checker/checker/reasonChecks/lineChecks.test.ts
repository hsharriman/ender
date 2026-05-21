import { buildPremises } from "../premises";
import { runProofCheckerFromText } from "../../proofChecker";
import { altint, perp_con_ang } from "./lineChecks";

const s1c1WithCpctc = `title: S1C1
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
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
[05] cpctc(4) -> con_ang(a_CAM,a_DBM)`;

const conAng = (a1: string, a2: string) => ({
  function: "con_ang",
  arguments: [
    { type: "Angle" as const, v: a1 },
    { type: "Angle" as const, v: a2 },
  ],
});

test("altint: vertical angles CMA/DMB do not justify para on transversal AB", () => {
  const { proof, graph } = runProofCheckerFromText(s1c1WithCpctc.replace(
    /\n\[04\].*\n\[05\].*/s,
    "",
  ));
  const ctx = buildPremises(proof);
  const trans = [...graph.diagramPremises.values()].find(
    (d) => d.statement.function === "transversal",
  )!.statement;
  expect(
    altint(conAng("CMA", "DMB"), trans, proof.goal!, ctx),
  ).toBe(false);
});

test("altint: alternate interior CAM/DBM justify para (centers A and B)", () => {
  const { proof, graph } = runProofCheckerFromText(s1c1WithCpctc);
  const ctx = buildPremises(proof);
  const trans = [...graph.diagramPremises.values()].find(
    (d) => d.statement.function === "transversal",
  )!.statement;
  expect(
    altint(conAng("CAM", "DBM"), trans, proof.goal!, ctx),
  ).toBe(true);
});

const s2c2Premises = `title: "S2C2"
premises:
pt: A (2, 1, bl), B (5.5, 6, t), C (9, 1, br), D (5.5, 1, b), F (1, 9, l), G (10, 9, r)
tri: t_FAB t_BCG t_BAD t_BCD
[g_1] perp(AC, BD)
[g_2] con_seg(AD, DC)
[g_3] con_ang(a_FAB, a_GCB)
[g_4] con_seg(AF, CG)
-> con_ang(a_AFB, a_CGB)

steps:
[01] given(g_1) -> perp(AC, BD)`;

const conRight = (a1: string, a2: string) => ({
  function: "con_right",
  arguments: [
    { type: "Angle" as const, v: a1 },
    { type: "Angle" as const, v: a2 },
  ],
});

test("perp_con_ang: right angles at intersection of perp lines", () => {
  const { proof } = runProofCheckerFromText(s2c2Premises);
  const ctx = buildPremises(proof);
  const perp = proof.steps.find((s) => s.stepNumber === "1")!.statement!;
  expect(
    perp_con_ang(perp, conRight("a_ADB", "a_BDC"), ctx),
  ).toBe(true);
});

test("perp_con_ang: rejects angles not at the perp intersection", () => {
  const { proof } = runProofCheckerFromText(s2c2Premises);
  const ctx = buildPremises(proof);
  const perp = proof.steps.find((s) => s.stepNumber === "1")!.statement!;
  expect(
    perp_con_ang(perp, conAng("a_AFB", "a_CGB"), ctx),
  ).toBe(false);
});

test("perp_con_ang proof step: invalid goal angle pair fails checker", () => {
  const result = runProofCheckerFromText(`${s2c2Premises}
[02] perp_con_ang(1) -> con_ang(a_AFB, a_CGB)`);
  expect(result.graph.incorrectSteps.has("2")).toBe(true);
});

test("altint: ACM/BDM are not the A/B transversal alternate-interior pair", () => {
  const { proof, graph } = runProofCheckerFromText(s1c1WithCpctc);
  const ctx = buildPremises(proof);
  const trans = [...graph.diagramPremises.values()].find(
    (d) => d.statement.function === "transversal",
  )!.statement;
  expect(
    altint(conAng("ACM", "BDM"), trans, proof.goal!, ctx),
  ).toBe(false);
});
