import * as fs from "fs";
import * as path from "path";
import { buildPremises } from "../checker/premises";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "../grammar/defsParsers";
import { runProofChecker, runProofCheckerFromText, trialAppendProofStep } from "../proofChecker";
import { premisesProofTextFromFile } from "./provePremisesFromProofs";
import { provePremisesSolveOpts } from "./provePremisesFromProofs";
import { __solverTest, solve } from "./solver";

const overlapPremises = premisesProofTextFromFile(
  fs.readFileSync(
    path.join(__dirname, "../proofs/overlap.txt"),
    "utf8",
  ),
);

test("canonical overlap steps pass checker", () => {
  const text = `${overlapPremises.replace(/\nsteps:\s*$/, "")}
steps:
[01] given(g_1) -> con_seg(EG,DG)
[02] given(g_2) -> con_ang(a_GEH,a_FDG)
[03] reflex_a() -> con_ang(a_EGD,a_EGD)
[04] asa(2,1,3) -> con_tri(t_EHG,t_DFG)
[05] cpctc(4) -> con_seg(FG,HG)
`;
  const res = runProofCheckerFromText(text);
  const step4 = res.proof.steps.find((s) => s.stepNumber === "4");
  expect(step4?.errors ?? []).toEqual([]);
});

test("solver reflex_a then asa(2,1,3) passes checker", () => {
  const checked = runProofCheckerFromText(overlapPremises);
  const seeded = __solverTest.seedGivenSteps(checked.proof);
  const initial = runProofChecker(seeded.proof);
  const premiseCtx = buildPremises(initial.proof);
  const reasons = loadReasonDefinitions();
  const { statements, groups } = loadStatementDefinitions();

  const reflexSteps = __solverTest.genStepsForPlan(
    initial.proof,
    premiseCtx,
    {
      reasonName: "reflex_a",
      conclusionFn: "con_ang",
      proofDepTypes: [],
      diagramDepTypes: [],
    },
    checked.proof.goal,
    reasons,
    statements,
    groups,
  );
  const reflex = reflexSteps[0]!;
  let state = {
    proof: initial.proof,
    graph: initial.graph,
    reasonIndex: initial.reasonIndex,
  };
  const reflexTrial = trialAppendProofStep(
    state.proof,
    state.graph,
    state.reasonIndex,
    reflex,
    premiseCtx,
    initial.geometricObjectErrors,
  );
  expect(reflexTrial.graph.incorrectSteps.has(reflex.stepNumber!)).toBe(false);
  state = {
    proof: reflexTrial.trialProof,
    graph: reflexTrial.graph,
    reasonIndex: reflexTrial.reasonIndex,
  };

  const asaSteps = __solverTest.genStepsForPlan(
    state.proof,
    premiseCtx,
    {
      reasonName: "asa",
      conclusionFn: "con_tri",
      proofDepTypes: ["congruent_angs", "con_seg", "congruent_angs"],
      diagramDepTypes: [],
    },
    undefined,
    reasons,
    statements,
    groups,
  );
  const asa = asaSteps.find((s) => s.reason?.arguments?.join(",") === "2,1,3");
  expect(asa).toBeDefined();
  const asaTrial = trialAppendProofStep(
    state.proof,
    state.graph,
    state.reasonIndex,
    asa!,
    premiseCtx,
    initial.geometricObjectErrors,
  );
  expect([...asaTrial.graph.incorrectSteps]).toEqual([]);
});

test("solve overlap premises", () => {
  const checked = runProofCheckerFromText(overlapPremises);
  const res = solve(checked.proof, {
    ...provePremisesSolveOpts,
    maxPlans: 500,
    logBackwardChains: 0,
  });
  expect(res.status).toBe("solved");
});
