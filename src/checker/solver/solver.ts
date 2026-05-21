import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { buildPremises } from "../checker/premises";
import { proofHasPointOnLineDiagram } from "../checker/pointOnLineGroup";
import { cpctcCorrespondingConclusions } from "../checker/reasonChecks/triangleChecks";
import { stmtKey } from "../checker/reasonChecks/utils";
import { REASONS_DEFS } from "../grammar/defs/reasons.defs";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "../grammar/defsParsers";
import {
  runProofChecker,
  trialAppendProofStep,
  type TrialAppendProofStepResult,
} from "../proofChecker";
import { stmtToString, proofToString } from "../proofToString";
import {
  ParseDiagramStmt,
  ProofGraph,
  ProofObj,
  ProofStep,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
  Stmt,
} from "../types/checkerTypes";
import type { ReasonApplicabilityIndex } from "../checker/reasonFulfillment";
import { buildProofPlans, type PlanStep, type ProofPlan } from "./proofPlan";
import {
  SolverAttempt,
  SolverOpts,
  SolverResult,
  SolverStats,
  SolverStep,
} from "./types";

const UNSAFE_REASONS = new Set([
  "given",
  "paralellogram1",
  "paralellogram2",
  "equilateral",
  "aaa",
]);

const DEFINED_REASONS = new Set(
  Object.keys(REASONS_DEFS).filter((reason) => !UNSAFE_REASONS.has(reason)),
);

type Pool = Map<ParseObj["type"], ParseObj[]>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const orderedChars = (value: string) =>
  value
    .split("")
    .sort((left, right) => left.localeCompare(right))
    .join("");
const angleKey = (value: string) =>
  value.length >= 3
    ? `${value[1]}:${orderedChars(`${value[0]}${value[value.length - 1]}`)}`
    : value;
const argKey = (arg: ParseObj) => {
  if (arg.type === Obj.Segment || arg.type === Obj.Triangle) {
    return `${arg.type}:${orderedChars(arg.v)}`;
  }
  if (arg.type === Obj.Angle) return `${arg.type}:${angleKey(arg.v)}`;
  return `${arg.type}:${arg.v}`;
};
const sameArg = (left: ParseObj, right: ParseObj) =>
  left.type === right.type && argKey(left) === argKey(right);
const refKey = (refs: string[]) =>
  [...refs].sort((left, right) => left.localeCompare(right)).join("|");
const goalOf = (proof: ProofObj) =>
  proof.steps.find((step) => step.type === "goal")?.statement ?? proof.goal;
const statementsEquivalent = (left?: Stmt, right?: Stmt) => {
  if (!left || !right) return false;
  if (left.function !== right.function) return false;
  if (left.arguments.length !== right.arguments.length) return false;

  const direct = left.arguments.every((arg, idx) =>
    sameArg(arg, right.arguments[idx]),
  );
  if (direct) return true;

  // Binary geometric relations are symmetric for "already known" pruning.
  return (
    left.arguments.length === 2 &&
    left.arguments[0].type === left.arguments[1].type &&
    sameArg(left.arguments[0], right.arguments[1]) &&
    sameArg(left.arguments[1], right.arguments[0])
  );
};
const conclusions = (reason: ReasonDefinition) =>
  reason.conclusion.split(",").map((statement) => statement.trim());
const depName = (dep: string | StatementGroup) =>
  typeof dep === "string" ? dep : dep.name;

const clean = (proof: ProofObj): ProofObj => {
  const out = clone(proof);
  out.errors = [];
  out.steps = out.steps.map((step) => ({
    ...step,
    errors: [],
    diagramDeps: undefined,
    waysToProve: undefined,
  }));
  return out;
};

const objType = (param: string): ParseObj["type"] | undefined => {
  if (param.startsWith("Point")) return Obj.Point;
  if (param.startsWith("Segment")) return Obj.Segment;
  if (param.startsWith("Angle")) return Obj.Angle;
  if (param.startsWith("Triangle")) return Obj.Triangle;
  if (param.startsWith("Quadrilateral")) return Obj.Quadrilateral;
  return undefined;
};

const addObj = (pool: Pool, type: ParseObj["type"], label: string) => {
  const objs = pool.get(type) ?? [];
  if (!objs.some((obj) => obj.v === label)) objs.push({ type, v: label });
  pool.set(type, objs);
};

export const objectPool = (ctx: ProofContent): Pool => {
  const content = ctx.getCtx();
  const pool: Pool = new Map();
  content.points.forEach((point) => addObj(pool, Obj.Point, point.label));
  content.segments.forEach((segment) =>
    addObj(pool, Obj.Segment, segment.label),
  );
  content.angles.forEach((angle) => {
    addObj(pool, Obj.Angle, angle.label);
    angle.names.forEach((name) => addObj(pool, Obj.Angle, name));
  });
  content.triangles.forEach((triangle) =>
    addObj(pool, Obj.Triangle, triangle.label),
  );
  content.rectangles.forEach((quad) =>
    addObj(
      pool,
      Obj.Quadrilateral,
      quad.p.map((point) => point.label).join(""),
    ),
  );
  return pool;
};

const addSegmentByLabel = (pool: Pool, ctx: ProofContent, label: string) => {
  const segment = ctx.getSegment(label);
  if (!segment) return;
  segment.names.forEach((name) => addObj(pool, Obj.Segment, name));
};

const addAngleParts = (pool: Pool, ctx: ProofContent, label: string) => {
  const angle = ctx.getAngle(label);
  if (!angle) return;
  angle.names.forEach((name) => addObj(pool, Obj.Angle, name));
  [angle.start, angle.center, angle.end].forEach((point) =>
    addObj(pool, Obj.Point, point.label),
  );
  addSegmentByLabel(pool, ctx, `${angle.start.label}${angle.center.label}`);
  addSegmentByLabel(pool, ctx, `${angle.center.label}${angle.end.label}`);
};

const addArgScope = (pool: Pool, ctx: ProofContent, arg: ParseObj) => {
  addObj(pool, arg.type, arg.v);
  if (arg.type === Obj.Triangle) {
    const triangle = ctx.getTriangle(arg.v);
    if (triangle) addObj(pool, Obj.Triangle, triangle.label);
    triangle?.s.forEach((segment) =>
      segment.names.forEach((name) => addObj(pool, Obj.Segment, name)),
    );
    triangle?.a.forEach((angle) => addAngleParts(pool, ctx, angle.label));
  } else if (arg.type === Obj.Quadrilateral) {
    const quad = ctx.getQuadrilateral(arg.v);
    if (quad)
      addObj(pool, Obj.Quadrilateral, quad.p.map((p) => p.label).join(""));
    quad?.s.forEach((segment) =>
      segment.names.forEach((name) => addObj(pool, Obj.Segment, name)),
    );
    quad?.a.forEach((angle) => addAngleParts(pool, ctx, angle.label));
  } else if (arg.type === Obj.Segment) {
    const segment = ctx.getSegment(arg.v);
    if (!segment) return;
    segment.names.forEach((name) => addObj(pool, Obj.Segment, name));
    [segment.p1, segment.p2].forEach((point) =>
      addObj(pool, Obj.Point, point.label),
    );
  } else if (arg.type === Obj.Angle) {
    addAngleParts(pool, ctx, arg.v);
  }
};

const addStmtScope = (pool: Pool, ctx: ProofContent, stmt?: Stmt) => {
  stmt?.arguments.forEach((arg) => addArgScope(pool, ctx, arg));
  stmt?.arguments.forEach((arg) => {
    if (arg.type !== Obj.Segment && arg.type !== Obj.Angle) return;
    ctx.getCtx().triangles.forEach((triangle) => {
      if (triangle.containsParseObj(arg)) {
        addObj(pool, Obj.Triangle, triangle.label);
      }
    });
  });
  if (stmt?.function === "transversal" && stmt.arguments.length >= 6) {
    addSegmentByLabel(
      pool,
      ctx,
      `${stmt.arguments[0].v}${stmt.arguments[1].v}`,
    );
    addSegmentByLabel(
      pool,
      ctx,
      `${stmt.arguments[3].v}${stmt.arguments[4].v}`,
    );
  }
};

const stmtByRef = (proof: ProofObj, ref: string): Stmt | undefined =>
  proof.steps.find((step) => step.stepNumber === ref)?.statement ??
  proof.premises.diagramStatements.find((diag) => diag.stepNumber === ref)
    ?.statement;

const matchingDiags = (
  proof: ProofObj,
  reason: ReasonDefinition,
  groups: Map<string, StatementGroup>,
): ParseDiagramStmt[] =>
  (reason.diagramDependencies ?? []).flatMap((dep) => {
    const fns = depFns(depName(dep), groups);
    return proof.premises.diagramStatements.filter((diag) =>
      fns.includes(diag.statement.function),
    );
  });

const scopedPool = (
  proof: ProofObj,
  ctx: ProofContent,
  reason: ReasonDefinition,
  refs: string[],
  groups: Map<string, StatementGroup>,
): Pool => {
  const pool: Pool = new Map();
  refs.forEach((ref) => addStmtScope(pool, ctx, stmtByRef(proof, ref)));
  matchingDiags(proof, reason, groups).forEach((diag) =>
    addStmtScope(pool, ctx, diag.statement),
  );
  return pool.size > 0 ? pool : objectPool(ctx);
};



const midptCandidatesFromOnLine = (proof: ProofObj, goal?: Stmt): Stmt[] => {
  const rows = proof.premises.diagramStatements
    .filter((diag) => diag.statement.function === "on_line")
    .map((diag) => ({
      function: "midpt" as const,
      arguments: [diag.statement.arguments[0], diag.statement.arguments[1]],
    }));
  const deduped: Stmt[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = stmtKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  if (!goal || goal.function !== "midpt") return deduped;
  const goalKey = stmtKey(goal);
  return deduped.filter((stmt) => stmtKey(stmt) === goalKey);
};

const argCombinations = (
  types: ParseObj["type"][],
  pool: Pool,
): ParseObj[][] => {
  const combos: ParseObj[][] = [];
  const seen = new Set<string>();

  const walk = (index: number, args: ParseObj[]) => {
    if (index === types.length) {
      // One representative per unordered object multiset.
      const key = args
        .map(argKey)
        .sort((left, right) => left.localeCompare(right))
        .join("|");
      if (!seen.has(key)) {
        seen.add(key);
        combos.push([...args]);
      }
      return;
    }
    for (const arg of pool.get(types[index]) ?? []) {
      args.push(arg);
      walk(index + 1, args);
      args.pop();
    }
  };

  walk(0, []);
  return combos;
};

const statementsFor = (
  fn: string,
  statementDefs: Map<string, StatementDefinition>,
  pool: Pool,
  goal?: Stmt,
): Stmt[] => {
  if (goal?.function === fn) {
    const inScope = goal.arguments.every((arg) =>
      (pool.get(arg.type) ?? []).some((obj) => sameArg(obj, arg)),
    );
    return inScope ? [goal] : [];
  }
  const statementDef = statementDefs.get(fn);
  if (!statementDef || statementDef.isPremisesOnly) return [];
  const types = statementDef.parameters.map(objType);
  if (types.some((type) => !type)) return [];
  return argCombinations(types as ParseObj["type"][], pool).map((args) => ({
    function: fn,
    arguments: args,
  }));
};

const depFns = (dep: string, groups: Map<string, StatementGroup>) => {
  const group = groups.get(dep);
  return group ? [group.base, ...group.extensions] : [dep];
};

const factMap = (proof: ProofObj) => {
  const facts = new Map<string, string[]>();
  proof.steps.forEach((step) => {
    if (
      step.type === "goal" ||
      !step.statement ||
      !/^\d+$/.test(step.stepNumber ?? "")
    )
      return;
    const refs = facts.get(step.statement.function) ?? [];
    refs.push(step.stepNumber!);
    facts.set(step.statement.function, refs);
  });
  return facts;
};

const hasDiag = (
  proof: ProofObj,
  dep: string | StatementGroup,
  groups: Map<string, StatementGroup>,
) => {
  const key = depName(dep);
  if (key === "point_on_line") {
    return proofHasPointOnLineDiagram(proof);
  }
  const fns = depFns(key, groups);
  return proof.premises.diagramStatements.some((diag) =>
    fns.includes(diag.statement.function),
  );
};

const depRefSlots = (
  reason: ReasonDefinition,
  groups: Map<string, StatementGroup>,
  facts: Map<string, string[]>,
) =>
  reason.dependencies.map((dep) =>
    depFns(depName(dep), groups).flatMap((fn) => facts.get(fn) ?? []),
  );

const refCombinations = (
  reason: ReasonDefinition,
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
): string[][] => {
  if (reason.diagramDependencies?.some((dep) => !hasDiag(proof, dep, groups)))
    return [];
  const facts = factMap(proof);
  const slots = depRefSlots(reason, groups, facts);
  if (slots.some((slot) => slot.length === 0)) return [];
  const combos: string[][] = [];
  const seen = new Set<string>();
  const used = new Set<string>();

  const walk = (index: number, refs: string[]) => {
    if (index === slots.length) {
      const key = refKey(refs);
      if (!seen.has(key)) {
        seen.add(key);
        combos.push([...refs]);
      }
      return;
    }
    for (const ref of slots[index]) {
      if (used.has(ref)) continue;
      used.add(ref);
      refs.push(ref);
      walk(index + 1, refs);
      refs.pop();
      used.delete(ref);
    }
  };

  walk(0, []);
  return combos;
};

const candSortKey = (step: ProofStep) =>
  JSON.stringify({
    reason: step.reason?.function,
    reasonArgs: step.reason?.arguments,
    statement: step.statement ? stmtKey(step.statement) : "",
  });

const angleCenter = (label: string) => {
  const raw = label.startsWith("a_") ? label.slice(2) : label;
  return raw.length >= 3 ? raw[1] : "";
};

const angleEndpoints = (label: string) => {
  const raw = label.startsWith("a_") ? label.slice(2) : label;
  return raw.length >= 3 ? [raw[0], raw[2]] : [];
};

/** True when the two angles share a vertex but no common side (vertical pair). */
const isVerticalAnglePair = (left: string, right: string) => {
  const center = angleCenter(left);
  if (center !== angleCenter(right)) return false;
  const sharesArm = (ends: string[], other: string[]) =>
    ends.some((end) => end !== center && other.includes(end));
  return !sharesArm(angleEndpoints(left), angleEndpoints(right));
};

/** Prefer geometrically plausible candidates; backtracking validates the rest. */
const candidateRank = (
  planStep: PlanStep,
  step: SolverStep,
  proof?: ProofObj,
): number => {
  const stmt = step.statement;
  if (!stmt) return 10;
  if (planStep.reasonName === "asa" && proof && step.reason?.arguments) {
    const refs = step.reason.arguments;
    if (refs.length === 3 && refs[0] === "2" && refs[1] === "1") return 0;
  }
  if (planStep.reasonName === "vert_ang" && stmt.function === "con_ang") {
    const [left, right] = stmt.arguments;
    if (
      left?.type === Obj.Angle &&
      right?.type === Obj.Angle &&
      isVerticalAnglePair(left.v, right.v)
    ) {
      return 0;
    }
    return 5;
  }
  return 10;
};

const sortCandidates = (
  planStep: PlanStep,
  steps: SolverStep[],
  proof?: ProofObj,
) =>
  [...steps].sort(
    (left, right) =>
      candidateRank(planStep, left, proof) -
        candidateRank(planStep, right, proof) ||
      candSortKey(left).localeCompare(candSortKey(right)),
  );

const knownStatementKeys = (proof: ProofObj): Set<string> => {
  const keys = new Set<string>();
  for (const step of proof.steps) {
    if (step.statement) keys.add(stmtKey(step.statement));
  }
  return keys;
};

const nextStepNumber = (proof: ProofObj) => {
  const nums = proof.steps
    .filter(
      (step) => step.type === "proof" && /^\d+$/.test(step.stepNumber ?? ""),
    )
    .map((step) => parseInt(step.stepNumber!, 10));
  return `${Math.max(0, ...nums) + 1}`;
};

const statementExists = (proof: ProofObj, statement: Stmt) =>
  proof.steps.some(
    (step) => step.statement && statementsEquivalent(step.statement, statement),
  );

const triangleLabel = (value: string) =>
  value.startsWith("t_") ? value.slice(2) : value;

/** Shared side between two triangles (e.g. `AC` for `ABC` and `ADC`). */
const sharedSegmentLabel = (
  ctx: ProofContent,
  tri1: string,
  tri2: string,
): string | undefined => {
  const left = ctx.getTriangle(triangleLabel(tri1));
  const right = ctx.getTriangle(triangleLabel(tri2));
  if (!left || !right) return undefined;
  const leftLabels = new Set(left.s.map((segment) => segment.label));
  const shared = right.s.find((segment) => leftLabels.has(segment.label));
  return shared?.label;
};

/** When premises name exactly two triangles, use them as the `con_tri` statement target. */
const premiseTrianglePair = (proof: ProofObj): Stmt | undefined => {
  const tris = proof.premises.triangles;
  if (tris.length !== 2) return undefined;
  return {
    function: "con_tri",
    arguments: tris.map((tri) => ({ type: Obj.Triangle, v: tri.v })),
  };
};

/** Reflexive `con_ang` for the sole named angle in premises (e.g. ASA slot `a_EGD`). */
const reflexAngFromPremises = (proof: ProofObj): Stmt | undefined => {
  const angles = proof.premises.angles;
  if (angles.length !== 1) return undefined;
  const v = angles[0]!.v;
  return {
    function: "con_ang",
    arguments: [
      { type: Obj.Angle, v },
      { type: Obj.Angle, v },
    ],
  };
};

const reflexSegFromPremiseTriangles = (
  proof: ProofObj,
  ctx: ProofContent,
): Stmt | undefined => {
  const triGoal = premiseTrianglePair(proof);
  if (!triGoal) return undefined;
  return reflexSegForCongruenceGoal(triGoal, ctx);
};

const reflexSegForCongruenceGoal = (
  goal: Stmt | undefined,
  ctx: ProofContent,
): Stmt | undefined => {
  if (!goal || goal.function !== "con_tri" || goal.arguments.length !== 2) {
    return undefined;
  }
  const seg = sharedSegmentLabel(
    ctx,
    goal.arguments[0].v,
    goal.arguments[1].v,
  );
  if (!seg) return undefined;
  return {
    function: "con_seg",
    arguments: [
      { type: Obj.Segment, v: seg },
      { type: Obj.Segment, v: seg },
    ],
  };
};

const makeStep = (
  stepNumber: string,
  reason: string,
  refs: string[],
  statement: Stmt,
): SolverStep => ({
  type: "proof",
  stepNumber,
  reason: { function: reason, arguments: refs },
  statement,
  errors: [],
});

const hasProofSteps = (proof: ProofObj) =>
  proof.steps.some((step) => step.type === "proof");

const seedGivenSteps = (
  proof: ProofObj,
): { proof: ProofObj; steps: SolverStep[] } => {
  if (hasProofSteps(proof)) return { proof, steps: [] };
  const givens = proof.steps
    .filter(
      (step) => step.type === "given" && step.statement && step.stepNumber,
    )
    .map((step, index) =>
      makeStep(`${index + 1}`, "given", [step.stepNumber!], step.statement!),
    );
  return {
    proof: {
      ...clone(proof),
      steps: [...clone(proof.steps), ...givens],
    },
    steps: givens,
  };
};

/** Forward pass: candidates for one planned reason row. */
const genStepsForPlan = (
  proof: ProofObj,
  ctx: ProofContent,
  planStep: PlanStep,
  goal: Stmt | undefined,
  reasons: Map<string, ReasonDefinition>,
  statements: Map<string, StatementDefinition>,
  groups: Map<string, StatementGroup>,
  opts?: { isLastPlanStep?: boolean },
): SolverStep[] => {
  const reason = reasons.get(planStep.reasonName);
  if (!reason || !DEFINED_REASONS.has(planStep.reasonName)) return [];

  const nextNumber = nextStepNumber(proof);
  const knownFacts = knownStatementKeys(proof);
  const reasonSteps: SolverStep[] = [];
  const refs = refCombinations(reason, proof, groups);
  if (reason.dependencies.length > 0 && refs.length === 0) return [];
  const dependencySets = reason.dependencies.length === 0 ? [[]] : refs;

  for (const deps of dependencySets) {
    let stmtGoal =
      opts?.isLastPlanStep &&
      goal?.function === planStep.conclusionFn
        ? goal
        : undefined;
    if (
      !stmtGoal &&
      planStep.reasonName === "reflex_s" &&
      planStep.conclusionFn === "con_seg"
    ) {
      stmtGoal =
        reflexSegFromPremiseTriangles(proof, ctx) ??
        (goal?.function === "con_tri"
          ? reflexSegForCongruenceGoal(goal, ctx)
          : undefined);
    }
    if (
      !stmtGoal &&
      planStep.reasonName === "reflex_a" &&
      planStep.conclusionFn === "con_ang"
    ) {
      stmtGoal = reflexAngFromPremises(proof);
    }
    if (!stmtGoal && planStep.conclusionFn === "con_tri") {
      stmtGoal = premiseTrianglePair(proof);
    }
    const cpctcConclusions =
      planStep.reasonName === "cpctc" &&
      (planStep.conclusionFn === "con_ang" ||
        planStep.conclusionFn === "con_seg") &&
      deps.length === 1
        ? (() => {
            const conTri = stmtByRef(proof, deps[0]);
            if (!conTri || conTri.function !== "con_tri") return [];
            let candidates = cpctcCorrespondingConclusions(
              conTri,
              planStep.conclusionFn as "con_ang" | "con_seg",
              ctx,
            );
            if (stmtGoal) {
              const goalKey = stmtKey(stmtGoal);
              candidates = [...candidates].sort((left, right) => {
                const leftMatch = stmtKey(left) === goalKey ? -1 : 0;
                const rightMatch = stmtKey(right) === goalKey ? -1 : 0;
                return leftMatch - rightMatch;
              });
            }
            return candidates;
          })()
        : null;

    const midptFromOnLine =
      planStep.conclusionFn === "midpt"
        ? midptCandidatesFromOnLine(proof, stmtGoal)
        : null;

    let pool = scopedPool(proof, ctx, reason, deps, groups);
    const statementCandidates =
      cpctcConclusions ??
      midptFromOnLine ??
      (() => {
        if (
          !statementsFor(planStep.conclusionFn, statements, pool, stmtGoal)
            .length
        ) {
          pool = objectPool(ctx);
        }
        return statementsFor(
          planStep.conclusionFn,
          statements,
          pool,
          stmtGoal,
        );
      })();

    for (const statement of statementCandidates) {
      if (knownFacts.has(stmtKey(statement))) continue;
      if (statementExists(proof, statement)) continue;
      reasonSteps.push(
        makeStep(nextNumber, planStep.reasonName, deps, statement),
      );
    }
  }

  return sortCandidates(planStep, reasonSteps, proof);
};

const startErrors = (result: ReturnType<typeof runProofChecker>): string[] => {
  const errors: string[] = [];
  if (result.geometricObjectErrors.length)
    errors.push(...result.geometricObjectErrors);
  if (result.duplicateSteps.length)
    errors.push(`Duplicate steps: ${result.duplicateSteps.length}`);
  if (result.stepNumberErrors.length) errors.push(...result.stepNumberErrors);
  if (result.graph.cycles.length)
    errors.push(`Cycles: ${result.graph.cycles.length}`);
  if (result.graph.incorrectSteps.size)
    errors.push(
      `Incorrect steps: ${[...result.graph.incorrectSteps].join(", ")}`,
    );
  return errors;
};

const trialStartErrors = (trial: TrialAppendProofStepResult): string[] => {
  const errors: string[] = [];
  if (trial.geometricObjectErrors.length)
    errors.push(...trial.geometricObjectErrors);
  if (trial.duplicateSteps.length)
    errors.push(`Duplicate steps: ${trial.duplicateSteps.length}`);
  if (trial.stepNumberErrors.length) errors.push(...trial.stepNumberErrors);
  if (trial.graph.cycles.length)
    errors.push(`Cycles: ${trial.graph.cycles.length}`);
  if (trial.graph.incorrectSteps.size)
    errors.push(
      `Incorrect steps: ${[...trial.graph.incorrectSteps].join(", ")}`,
    );
  return errors;
};

type ForwardState = {
  proof: ProofObj;
  graph: ProofGraph;
  reasonIndex: ReasonApplicabilityIndex;
  solverSteps: SolverStep[];
};

const realizePlan = (
  plan: ProofPlan,
  initial: ForwardState,
  goal: Stmt,
  premiseCtx: ProofContent,
  geometricObjectErrors: string[],
  reasons: Map<string, ReasonDefinition>,
  statements: Map<string, StatementDefinition>,
  groups: Map<string, StatementGroup>,
  maxCandidatesPerStep: number,
  attempts: SolverAttempt[],
  planIndex: number,
): ForwardState | null => {
  const realizeFrom = (
    stepIdx: number,
    state: ForwardState,
  ): ForwardState | null => {
    if (stepIdx >= plan.steps.length) {
      return statementExists(state.proof, goal) ? state : null;
    }

    const planStep = plan.steps[stepIdx];
    const candidates = sortCandidates(
      planStep,
      genStepsForPlan(
        state.proof,
        premiseCtx,
        planStep,
        goal,
        reasons,
        statements,
        groups,
        { isLastPlanStep: stepIdx === plan.steps.length - 1 },
      ),
      state.proof,
    ).slice(0, maxCandidatesPerStep);

    for (const candidate of candidates) {
      const trial = trialAppendProofStep(
        state.proof,
        state.graph,
        state.reasonIndex,
        candidate,
        premiseCtx,
        geometricObjectErrors,
      );
      const candidateErrors = trialStartErrors(trial);
      const passed =
        candidateErrors.length === 0 &&
        !trial.graph.incorrectSteps.has(candidate.stepNumber);
      attempts.push({
        depth: planIndex * 100 + stepIdx + 1,
        reason: candidate.reason.function,
        refs: candidate.reason.arguments,
        statement: stmtToString(candidate.statement),
        passed,
        errors: candidateErrors,
      });
      if (!passed) continue;

      const checkedStep = trial.trialProof.steps.find(
        (step) => step.stepNumber === candidate.stepNumber,
      );
      const step = (checkedStep ?? candidate) as SolverStep;
      const nextState: ForwardState = {
        proof: trial.trialProof,
        graph: trial.graph,
        reasonIndex: trial.reasonIndex,
        solverSteps: [...state.solverSteps, step],
      };
      const finished = realizeFrom(stepIdx + 1, nextState);
      if (finished) return finished;
    }

    return null;
  };

  return realizeFrom(0, initial);
};

const emptyStats = (): SolverStats => ({
  backwardReasonsTried: 0,
  backwardPlansGenerated: 0,
  forwardStepAttempts: 0,
  backwardChains: [],
});

export const solve = (proof: ProofObj, opts: SolverOpts = {}): SolverResult => {
  const maxDepth = opts.maxDepth ?? 4;
  const stopAfterFirstPlan = opts.stopAfterFirstPlan ?? false;
  const maxPlans =
    opts.maxPlans ?? (stopAfterFirstPlan ? 1 : 500);
  const maxCandidatesPerStep = opts.maxCandidatesPerStep ?? 1000;
  const maxChildPlans = stopAfterFirstPlan ? 1 : opts.maxChildPlans;
  const seeded = seedGivenSteps(proof);
  const initial = runProofChecker(clean(seeded.proof));
  const errors = startErrors(initial);
  if (errors.length) {
    return { status: "invalid-start", errors, attempts: [], stats: emptyStats() };
  }

  const goal = goalOf(initial.proof);
  if (!goal) {
    return {
      status: "invalid-start",
      errors: ["No goal found"],
      attempts: [],
      stats: emptyStats(),
    };
  }
  if (statementExists(initial.proof, goal)) {
    return {
      status: "solved",
      proofText: proofToString(initial.proof),
      checkedProof: initial.proof,
      proofSteps: [],
      attempts: [],
      stats: emptyStats(),
    };
  }

  const premiseCtx = buildPremises(initial.proof);
  premiseCtx.checkAngleOverlaps();

  const reasons = loadReasonDefinitions();
  const { statements, groups } = loadStatementDefinitions();
  if (maxPlans <= 0) {
    return { status: "capped", plansTried: 0, attempts: [], stats: emptyStats() };
  }

  const runPass = (allowCpctcForCongruentParts: boolean): SolverResult => {
    const attempts: SolverAttempt[] = [];
    const stats = emptyStats();
    const forwardInitial: ForwardState = {
      proof: initial.proof,
      graph: initial.graph,
      reasonIndex: initial.reasonIndex,
      solverSteps: seeded.steps,
    };
    const forwardSolvedRef: { current: ForwardState | null } = {
      current: null,
    };

    const { plans, stats: planStats, chains } = buildProofPlans(
      goal,
      initial.proof,
      {
        maxDepth,
        maxPlans,
        maxChildPlans,
        stopAfterFirstPlan,
        logChainsMax: opts.logBackwardChains ?? 0,
        allowCpctcForCongruentParts,
        onNewCompleteRootPlan: (plan) => {
          const result = realizePlan(
            plan,
            forwardInitial,
            goal,
            premiseCtx,
            initial.geometricObjectErrors,
            reasons,
            statements,
            groups,
            maxCandidatesPerStep,
            attempts,
            0,
          );
          if (result) {
            forwardSolvedRef.current = result;
            return true;
          }
          return false;
        },
      },
    );
    stats.backwardReasonsTried = planStats.reasonsTried;
    stats.backwardPlansGenerated = planStats.plansGenerated;
    stats.backwardChains = chains;

    const forwardSolved = forwardSolvedRef.current;
    if (forwardSolved) {
      stats.forwardStepAttempts = attempts.length;
      const finalized = runProofChecker(forwardSolved.proof);
      return {
        status: "solved",
        proofText: proofToString(finalized.proof),
        checkedProof: finalized.proof,
        proofSteps: forwardSolved.solverSteps,
        attempts,
        stats,
      };
    }

    for (let planIndex = 0; planIndex < plans.length; planIndex++) {
      const result = realizePlan(
        plans[planIndex],
        forwardInitial,
        goal,
        premiseCtx,
        initial.geometricObjectErrors,
        reasons,
        statements,
        groups,
        maxCandidatesPerStep,
        attempts,
        planIndex,
      );
      if (!result) continue;

      stats.forwardStepAttempts = attempts.length;
      const finalized = runProofChecker(result.proof);
      return {
        status: "solved",
        proofText: proofToString(finalized.proof),
        checkedProof: finalized.proof,
        proofSteps: result.solverSteps,
        attempts,
        stats,
      };
    }

    stats.forwardStepAttempts = attempts.length;
    if (stopAfterFirstPlan && plans.length >= maxPlans) {
      return { status: "capped", plansTried: plans.length, attempts, stats };
    }
    return { status: "not-found", plansTried: plans.length, attempts, stats };
  };

  const cpctcOnlyPass = opts.allowCpctcForCongruentParts === true;
  let result = runPass(cpctcOnlyPass);
  if (result.status !== "solved" && !cpctcOnlyPass) {
    result = runPass(true);
    result.stats.cpctcRetryUsed = true;
  }
  return result;
};

export const __solverTest = {
  argCombinations,
  objectPool,
  scopedPool,
  statementsFor,
  genStepsForPlan,
  buildProofPlans,
  refCombinations,
  knownStatementKeys,
  seedGivenSteps,
  realizePlan,
};
