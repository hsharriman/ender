import { buildPremises } from "../checker/premises";
import { loadStatementDefinitions } from "../grammar/defsParsers";
import { runProofCheckerFromText } from "../proofChecker";
import {
  buildProofPlans,
  converseDefinitionBlocked,
  depSlotNeedsPlan,
  proofRowSatisfiesParentSlot,
  subgoalSatisfied,
} from "./proofPlan";

const seedGivensAsProof = (proof: import("../types/checkerTypes").ProofObj) => {
  if (proof.steps.some((step) => step.type === "proof")) return proof;
  const givens = proof.steps.filter(
    (step) => step.type === "given" && step.statement && step.stepNumber,
  );
  const rows = givens.map((step, index) => ({
    type: "proof" as const,
    stepNumber: `${index + 1}`,
    reason: { function: "given", arguments: [step.stepNumber!] },
    statement: step.statement!,
    errors: [] as string[],
  }));
  return { ...proof, steps: [...proof.steps, ...rows] };
};

const s1c1Premises = `title: S1C1
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[g_1] con_seg(AM,BM) 
[g_2] con_seg(CM,DM)
-> para(AC,BD)`;

test("parent slot: vertical angles do not satisfy altint_conv", () => {
  const proof = runProofCheckerFromText(`${s1c1Premises}
steps:
[03] vert_ang() -> con_ang(a_CMA, a_DMB)`).proof;
  const ctx = buildPremises(proof);
  const { groups } = loadStatementDefinitions();
  const parent = {
    reasonName: "altint_conv",
    conclusionFn: "para",
    depKey: "con_ang",
    goal: proof.goal!,
  };
  const vert = proof.steps.find((s) => s.stepNumber === "3")!.statement!;
  expect(proofRowSatisfiesParentSlot(vert, parent, proof, ctx)).toBe(false);
  expect(
    depSlotNeedsPlan(proof, groups, "con_ang", 0, undefined, parent, ctx),
  ).toBe(true);
});

test("parent slot: cpctc CAM/DBM satisfies altint_conv", () => {
  const proof = runProofCheckerFromText(`${s1c1Premises}
steps:
[03] vert_ang() -> con_ang(a_CMA, a_DMB)
[04] sas(1, 3, 2) -> con_tri(t_ACM,t_BDM)
[05] cpctc(4) -> con_ang(a_CAM,a_DBM)`).proof;
  const ctx = buildPremises(proof);
  const { groups } = loadStatementDefinitions();
  const parent = {
    reasonName: "altint_conv",
    conclusionFn: "para",
    depKey: "con_ang",
    goal: proof.goal!,
  };
  const alt = proof.steps.find((s) => s.stepNumber === "5")!.statement!;
  expect(proofRowSatisfiesParentSlot(alt, parent, proof, ctx)).toBe(true);
  expect(
    depSlotNeedsPlan(proof, groups, "con_ang", 0, undefined, parent, ctx),
  ).toBe(false);
});

test("stopAfterFirstPlan returns one quality-ranked plan", () => {
  const proof = runProofCheckerFromText(`${s1c1Premises}
steps:
[01] given(g_2) -> con_seg(CM,DM)
[02] given(g_1) -> con_seg(AM,BM) 
[03] vert_ang() -> con_ang(a_CMA, a_DMB)`).proof;
  const { plans } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 3,
    maxPlans: 50,
    stopAfterFirstPlan: true,
    logChainsMax: 0,
  });
  expect(plans).toHaveLength(1);
  expect(plans[0].steps.map((s) => s.reasonName).join(" -> ")).toContain(
    "altint_conv",
  );
});

test("buildProofPlans: partial S1C1 includes sas cpctc chain", () => {
  const proofText = `title: S1C1
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
[01] given(g_2) ->  con_seg(CM,DM)
[02] given(g_1) ->  con_seg(AM,BM) `;
  const proof = seedGivensAsProof(runProofCheckerFromText(proofText).proof);
  const { plans } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 4,
    maxPlans: 50,
    maxChildPlans: 32,
  });
  const names = plans.map((p) => p.steps.map((s) => s.reasonName).join(" -> "));
  expect(names).toContain("vert_ang -> sas -> cpctc -> altint_conv");
});

test("buildProofPlans: para goal does not chain altint after altint_conv", () => {
  const proofText = `title: "S1C1"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[g_1] con_seg(AM,BM)
[g_2] con_seg(CM,DM)
-> para(AC,BD)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const { chains } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 6,
    maxPlans: 50,
    logChainsMax: 500,
  });
  const altintAfterConv = chains.filter((chain) => {
    const parts = chain.reasons.split(" -> ");
    const convIdx = parts.indexOf("altint_conv");
    return convIdx !== -1 && parts.slice(convIdx + 1).includes("altint");
  });
  expect(altintAfterConv).toHaveLength(0);
});

test("buildProofPlans: para goal includes altint_conv chain", () => {
  const proofText = `title: "S1C1"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[g_1] con_seg(AM,BM) 
[g_2] con_seg(CM,DM)
-> para(AC,BD)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const goal = proof.goal!;
  const { plans } = buildProofPlans(goal, proof, { maxDepth: 6, maxPlans: 50 });
  expect(plans.length).toBeGreaterThan(0);
  const shortest = plans[0].steps.map((s) => s.reasonName);
  expect(shortest).toContain("altint_conv");
  expect(shortest[shortest.length - 1]).toBe("altint_conv");
});

test("buildProofPlans: no reflex_s -> reflex_s chains", () => {
  const proofText = `title: "Tutorial #1 - Prove Triangles Congruent"
premises:
pt: A (5.5, 9, t), B (2, 3, l), C (5.5, 1, b), D (9, 3, r)
tri: t_ABC t_ADC
[g_1] con_seg(AB,AD)
[g_2] con_ang(a_BAC,a_DAC)
-> con_tri(t_ABC,t_ADC)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const { chains } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 4,
    maxPlans: 50,
    logChainsMax: 200,
  });
  const hasDoubleReflex = chains.some((c) =>
    c.reasons.includes("reflex_s -> reflex_s"),
  );
  expect(hasDoubleReflex).toBe(false);
});

test("buildProofPlans: reflex goal stays bounded", () => {
  const proofText = `title: "solver reflex"
premises:
pt: A (0, 0, b), B (1, 0, b), C (0, 1, b)
-> con_seg(AC, AC)

steps:
[01] reflex_s() -> con_seg(AB, AB)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const goal = proof.goal!;
  const { plans, stats } = buildProofPlans(goal, proof, {
    maxDepth: 1,
    maxPlans: 20,
  });
  expect(stats.reasonsTried).toBeLessThan(30);
  expect(plans.length).toBe(0);
});

test("converseDefinitionBlocked: midpt_conv only when goal is midpt", () => {
  const { statements } = loadStatementDefinitions();
  expect(
    converseDefinitionBlocked("midpt_conv", "midpt", "con_seg", statements),
  ).toBe(true);
  expect(
    converseDefinitionBlocked("midpt_conv", "midpt", "midpt", statements),
  ).toBe(false);
});

test("buildProofPlans: con_seg goal does not use midpt_conv", () => {
  const proofText = `title: "midpt conv prune"
premises:
pt: A (0, 0, b), B (2, 0, b), C (1, 0, b)
seg: AB
[d_01] on_line(AB, C)
-> con_seg(AC, BC)

steps:
[01] reflex_s() -> con_seg(AC, AC)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const { plans } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 4,
    maxPlans: 40,
    logChainsMax: 0,
  });
  const usesMidptConv = plans.some((plan) =>
    plan.steps.some((step) => step.reasonName === "midpt_conv"),
  );
  expect(usesMidptConv).toBe(false);
});

test("buildProofPlans: para goal may use altint_conv", () => {
  const proof = runProofCheckerFromText(`${s1c1Premises}
steps:
[01] given(g_2) -> con_seg(CM,DM)
[02] given(g_1) -> con_seg(AM,BM) 
[03] vert_ang() -> con_ang(a_CMA, a_DMB)`).proof;
  const { plans } = buildProofPlans(proof.goal!, proof, {
    maxDepth: 3,
    maxPlans: 20,
    logChainsMax: 0,
  });
  expect(
    plans.some((plan) =>
      plan.steps.some((step) => step.reasonName === "altint_conv"),
    ),
  ).toBe(true);
});

test("depSlotNeedsPlan: second congruent_angs slot needs a plan when only one given angle", () => {
  const proofText = `title: "overlap"
premises:
pt: E (2, 9, l), F (4.92, 5.5, bl), G (7, 3, b), H (9.08, 5.5, br), D (12, 9, r)
tri: t_EHG t_DFG
ang: a_EGD
[g_1] con_seg(EG,DG)
[g_2] con_ang(a_GEH,a_FDG)
-> con_seg(FG, HG)

steps:`;
  const proof = runProofCheckerFromText(proofText).proof;
  const { groups } = loadStatementDefinitions();
  expect(depSlotNeedsPlan(proof, groups, "congruent_angs", 0)).toBe(false);
  expect(depSlotNeedsPlan(proof, groups, "congruent_angs", 1)).toBe(true);
  expect(depSlotNeedsPlan(proof, groups, "con_seg", 0)).toBe(false);
});

test("buildProofPlans overlap includes reflex_a asa cpctc skeleton", () => {
  const proofText = `title: "overlap"
premises:
pt: E (2, 9, l), F (4.92, 5.5, bl), G (7, 3, b), H (9.08, 5.5, br), D (12, 9, r)
tri: t_EHG t_DFG
ang: a_EGD
[g_1] con_seg(EG,DG)
[g_2] con_ang(a_GEH,a_FDG)
-> con_seg(FG, HG)

steps:`;
  const proof = runProofCheckerFromText(proofText).proof;
  const goal = proof.goal!;
  const { plans } = buildProofPlans(goal, proof, {
    maxDepth: 6,
    maxPlans: 500,
    allowCpctcForCongruentParts: true,
    logChainsMax: 0,
  });
  const skeletons = plans.map((p) =>
    p.steps.map((s) => s.reasonName).join(" -> "),
  );
  expect(skeletons).toContain("reflex_a -> asa -> cpctc");
});

test("subgoalSatisfied detects existing proof rows", () => {
  const proofText = `title: "t"
premises:
pt: A (0, 0, b), B (1, 0, b)
-> con_seg(AB, AB)
steps:
[01] reflex_s() -> con_seg(AB, AB)`;
  const proof = runProofCheckerFromText(proofText).proof;
  const { groups } = loadStatementDefinitions();
  expect(subgoalSatisfied(proof, groups, "con_seg")).toBe(true);
});




