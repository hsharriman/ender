import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { buildPremises } from "../checker/premises";
import { REASONS_DEFS } from "../grammar/defs/reasons.defs";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "../grammar/defsParsers";
import { proofHasPointOnLineDiagram } from "../checker/pointOnLineGroup";
import { stmtToString } from "../proofToString";
import {
  ProofObj,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
  Stmt,
} from "../types/checkerTypes";
import {
  getParentDepSlotCheck,
  ParentSlotContext,
  proofRowSatisfiesParentSlot,
} from "./parentDepSlot";

export { proofRowSatisfiesParentSlot } from "./parentDepSlot";
export type { ParentSlotContext } from "./parentDepSlot";

const orderedChars = (value: string) =>
  value
    .split("")
    .sort((left, right) => left.localeCompare(right))
    .join("");
const angleKey = (value: string) =>
  value.length >= 3
    ? `${value[1]}:${orderedChars(`${value[0]}${value[value.length - 1]}`)}`
    : value;
const sameArg = (left: ParseObj, right: ParseObj) => {
  if (left.type !== right.type) return false;
  if (left.type === Obj.Segment || left.type === Obj.Triangle) {
    return (
      `${left.type}:${orderedChars(left.v)}` ===
      `${right.type}:${orderedChars(right.v)}`
    );
  }
  if (left.type === Obj.Angle) {
    return `${left.type}:${angleKey(left.v)}` === `${right.type}:${angleKey(right.v)}`;
  }
  return left.v === right.v;
};

const statementsEquivalent = (left?: Stmt, right?: Stmt) => {
  if (!left || !right) return false;
  if (left.function !== right.function) return false;
  if (left.arguments.length !== right.arguments.length) return false;
  const direct = left.arguments.every((arg, idx) =>
    sameArg(arg, right.arguments[idx]),
  );
  if (direct) return true;
  return (
    left.arguments.length === 2 &&
    left.arguments[0].type === left.arguments[1].type &&
    sameArg(left.arguments[0], right.arguments[1]) &&
    sameArg(left.arguments[1], right.arguments[0])
  );
};

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

const depName = (dep: string | StatementGroup) =>
  typeof dep === "string" ? dep : dep.name;

const conclusions = (reason: ReasonDefinition) =>
  reason.conclusion
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("__"));

const depFns = (dep: string, groups: Map<string, StatementGroup>) => {
  const group = groups.get(dep);
  return group ? [group.base, ...group.extensions] : [dep];
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

/** One proof row to add in the forward pass (structure only — refs/statements filled later). */
export type PlanStep = {
  reasonName: string;
  conclusionFn: string;
  /** Proof-step dependency slot types, in order (e.g. `con_seg`, `congruent_angs`). */
  proofDepTypes: string[];
  diagramDepTypes: string[];
};

export type ProofPlan = {
  steps: PlanStep[];
};

export type ReasonIndex = {
  byConclusionFn: Map<string, string[]>;
};

/** Reasons that establish triangle congruence (each adds a `con_tri` row). */
const TRIANGLE_CONG_REASONS = new Set([
  "sas",
  "sss",
  "asa",
  "aas",
  "rhl",
]);

/**
 * Multi-conclusion rules that may not be used backward to establish an earlier
 * conclusion (e.g. `con_seg` via `cpctc` when no `con_tri` exists yet).
 */
/** Rules not used backward to establish `con_seg` / `con_ang` (except `cpctc`; see opts). */
const BACKWARD_DERIVED_RULES = new Set(["rectangle"]);

export type GeometryBudget = {
  triangles: number;
  /** Max number of unique two-triangle congruence goals (n choose 2). */
  trianglePairs: number;
  segments: number;
  angles: number;
  quadrilaterals: number;
};

/** Statement conclusions bounded by named geometry in premises. */
const CONCLUSION_BUDGET_KEY: Record<string, keyof GeometryBudget> = {
  con_tri: "triangles",
  sim_tri: "triangles",
  isosceles: "triangles",
  equilateral: "triangles",
  con_seg: "segments",
  para: "segments",
  perp: "segments",
  sim_seg: "segments",
  midpt: "segments",
  con_ang: "angles",
  con_right: "angles",
  rectangle: "quadrilaterals",
  parallelogram: "quadrilaterals",
};

export const geometryBudget = (proof: ProofObj): GeometryBudget => {
  const ctx = buildPremises(proof).getCtx();
  const triangles = Math.max(
    proof.premises.triangles.length,
    ctx.triangles.length,
  );
  const trianglePairs =
    triangles >= 2 ? (triangles * (triangles - 1)) / 2 : 0;
  return {
    triangles,
    trianglePairs,
    segments: Math.max(proof.premises.segments.length, ctx.segments.length),
    angles: Math.max(proof.premises.angles.length, ctx.angles.length),
    quadrilaterals: Math.max(
      proof.premises.quadrilaterals.length,
      ctx.rectangles.length,
    ),
  };
};

type ConclusionCounts = Map<string, number>;

export const countEstablishedConclusions = (
  proof: ProofObj,
  planPrefix: PlanStep[],
): ConclusionCounts => {
  const counts: ConclusionCounts = new Map();
  const bump = (fn: string) => counts.set(fn, (counts.get(fn) ?? 0) + 1);

  for (const step of proof.steps) {
    if (step.statement?.function) bump(step.statement.function);
  }
  for (const step of planPrefix) {
    bump(step.conclusionFn);
  }
  return counts;
};

const quotaSignature = (counts: ConclusionCounts): string =>
  [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fn, n]) => `${fn}:${n}`)
    .join(";");

const targetKey = (target?: Stmt) => {
  if (!target) return "";
  return `${target.function}:${target.arguments.map((a) => `${a.type}:${a.v}`).join(",")}`;
};

export const canAppendPlanStep = (
  reasonName: string,
  conclusionFn: string,
  proof: ProofObj,
  planPrefix: PlanStep[],
  budget: GeometryBudget,
): boolean => {
  const counts = countEstablishedConclusions(proof, planPrefix);

  if (TRIANGLE_CONG_REASONS.has(reasonName)) {
    // A congruent-triangles row uses two distinct triangles; with N named
    // triangles there are at most N choose 2 distinct `con_tri` goals.
    const existingConTri = proof.steps.filter(
      (step) => step.statement?.function === "con_tri",
    ).length;
    const plannedConTri = planPrefix.filter(
      (step) => step.conclusionFn === "con_tri",
    ).length;
    if (existingConTri + plannedConTri >= budget.trianglePairs) return false;
  }

  if (reasonName === "cpctc") {
    const conTri = counts.get("con_tri") ?? 0;
    const cpctc = planPrefix.filter((s) => s.reasonName === "cpctc").length;
    if (cpctc >= conTri) return false;
  }

  // `midpt_conv` and `def_midpt` form a 2-cycle; allow at most one of each in the full prior chain.
  if (
    reasonName === "midpt_conv" &&
    (planPrefix.some((step) => step.reasonName === "midpt_conv") ||
      planPrefix.some((step) => step.reasonName === "def_midpt"))
  ) {
    return false;
  }
  if (
    reasonName === "def_midpt" &&
    planPrefix.some((step) => step.reasonName === "def_midpt")
  ) {
    return false;
  }

  // Discourage reflex_s -> reflex_s (two reflexive rows to fill two con_seg slots).
  if (
    reasonName === "reflex_s" &&
    planPrefix.some((step) => step.reasonName === "reflex_s")
  ) {
    return false;
  }

  const geoKey = CONCLUSION_BUDGET_KEY[conclusionFn];
  if (geoKey) {
    const used = counts.get(conclusionFn) ?? 0;
    if (used >= budget[geoKey]) return false;
  }

  return true;
};

/** `*_conv` may conclude a `definition` statement only when that statement is the proof goal. */
export const converseDefinitionBlocked = (
  reasonName: string,
  conclusionFn: string,
  rootGoalFn: string,
  statements: Map<string, StatementDefinition>,
): boolean => {
  if (!reasonName.endsWith("_conv")) return false;
  if (!statements.get(conclusionFn)?.definition) return false;
  return rootGoalFn !== conclusionFn;
};

const backwardRuleAllowed = (
  reason: ReasonDefinition,
  subgoalFn: string,
  proof: ProofObj,
  planPrefix: PlanStep[],
  groups: Map<string, StatementGroup>,
  rootGoalFn: string,
  allowCpctcForCongruentParts: boolean,
  statements: Map<string, StatementDefinition>,
): boolean => {
  if (
    reason.name === "cpctc" &&
    subgoalFn === "con_seg" &&
    !allowCpctcForCongruentParts
  ) {
    return false;
  }
  // `altint` is para -> con_ang; for a `para` goal use `altint_conv` only (not both).
  if (
    reason.name === "altint" &&
    subgoalFn === "con_ang" &&
    rootGoalFn === "para"
  ) {
    return false;
  }
  // Filling a group slot (e.g. SAS `congruent_angs`) needs a direct row, not cpctc/altint chains.
  if (
    isStatementGroupKey(subgoalFn, groups) &&
    reason.dependencies.length > 0
  ) {
    return false;
  }
  if (BACKWARD_DERIVED_RULES.has(reason.name) && reason.name !== "cpctc") {
    if (subgoalFn === "con_seg" || subgoalFn === "con_ang") return false;
  }
  const heads = conclusions(reason);
  if (
    heads.length > 1 &&
    !heads.some((fn) => conclusionMatchesSubgoal(fn, subgoalFn, groups))
  ) {
    return false;
  }
  for (const head of heads) {
    if (!conclusionMatchesSubgoal(head, subgoalFn, groups)) continue;
    if (
      converseDefinitionBlocked(
        reason.name,
        head,
        rootGoalFn,
        statements,
      )
    ) {
      return false;
    }
  }
  return true;
};

export const buildReasonIndex = (
  reasons: Map<string, ReasonDefinition>,
): ReasonIndex => {
  const byConclusionFn = new Map<string, string[]>();
  const upsert = (key: string, name: string) => {
    const list = byConclusionFn.get(key);
    if (list) {
      if (!list.includes(name)) list.push(name);
    } else {
      byConclusionFn.set(key, [name]);
    }
  };
  for (const reason of reasons.values()) {
    if (!DEFINED_REASONS.has(reason.name)) continue;
    for (const fn of conclusions(reason)) {
      upsert(fn, reason.name);
    }
  }
  return { byConclusionFn };
};

export const statementFnsForDepKey = (
  key: string,
  groups: Map<string, StatementGroup>,
): string[] => depFns(key, groups);

const conclusionMatchesSubgoal = (
  conclusionFn: string,
  subgoalKey: string,
  groups: Map<string, StatementGroup>,
): boolean =>
  conclusionFn === subgoalKey ||
  statementFnsForDepKey(subgoalKey, groups).includes(conclusionFn);

const reasonNamesForSubgoal = (
  subgoalKey: string,
  index: ReasonIndex,
  groups: Map<string, StatementGroup>,
): string[] => {
  const names = new Set<string>();
  for (const fn of statementFnsForDepKey(subgoalKey, groups)) {
    for (const name of index.byConclusionFn.get(fn) ?? []) {
      names.add(name);
    }
  }
  for (const name of index.byConclusionFn.get(subgoalKey) ?? []) {
    names.add(name);
  }
  return [...names];
};

export const subgoalSatisfied = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
): boolean => {
  const wanted = statementFnsForDepKey(subgoalKey, groups);
  return proof.steps.some(
    (step) =>
      step.statement && wanted.includes(step.statement.function),
  );
};

/** Dependency slots that may need a fresh row even when another row shares the type. */
const REASON_PRIORITY = [
  "sas",
  "sss",
  "asa",
  "aas",
  "rhl",
  "cpctc",
  "perp_con_ang",
  "def_con_right",
  "vert_ang",
  "altint_conv",
  "altint",
  "reflex_s",
  "reflex_a",
  "def_midpt",
  "midpt_conv",
];

const reasonPriority = (name: string) => {
  const idx = REASON_PRIORITY.indexOf(name);
  return idx === -1 ? REASON_PRIORITY.length : idx;
};

const proofRowsForSubgoal = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
): Stmt[] => {
  const wanted = statementFnsForDepKey(subgoalKey, groups);
  return proof.steps
    .filter(
      (step) =>
        step.statement && wanted.includes(step.statement.function),
    )
    .map((step) => step.statement!);
};

const countProofRowsSatisfyingParent = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
  parent: ParentSlotContext,
  ctx: ProofContent,
): number =>
  proofRowsForSubgoal(proof, groups, subgoalKey).filter((row) =>
    proofRowSatisfiesParentSlot(row, parent, proof, ctx),
  ).length;

/** Given premises that can satisfy a dependency group without a new proof row. */
/** True when `key` is a statement-group name used as a proof dependency slot (e.g. `congruent_angs`). */
const isStatementGroupKey = (
  key: string,
  groups: Map<string, StatementGroup>,
): boolean => {
  const group = groups.get(key);
  return group?.name === key;
};

const givenStatementCount = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
): number => {
  const wanted = statementFnsForDepKey(subgoalKey, groups);
  return proof.steps.filter(
    (step) =>
      step.type === "given" &&
      step.statement &&
      wanted.includes(step.statement.function),
  ).length;
};

const matchingStatementCount = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
): number => {
  const wanted = statementFnsForDepKey(subgoalKey, groups);
  return proof.steps.filter(
    (step) =>
      step.type === "proof" &&
      step.statement &&
      wanted.includes(step.statement.function),
  ).length;
};

export const depSlotNeedsPlan = (
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  subgoalKey: string,
  occurrence = 0,
  target?: Stmt,
  parent?: ParentSlotContext,
  premiseCtx?: ProofContent,
): boolean => {
  if (
    target &&
    proof.steps.some(
      (step) =>
        step.statement && statementsEquivalent(step.statement, target),
    )
  ) {
    return false;
  }
  if (givenStatementCount(proof, groups, subgoalKey) > occurrence) {
    return false;
  }

  if (
    parent &&
    premiseCtx &&
    getParentDepSlotCheck(parent.reasonName, parent.depKey)
  ) {
    const satisfying = countProofRowsSatisfyingParent(
      proof,
      groups,
      subgoalKey,
      parent,
      premiseCtx,
    );
    if (satisfying > occurrence) return false;
    return true;
  }

  if (matchingStatementCount(proof, groups, subgoalKey) > occurrence) {
    return false;
  }
  return true;
};

const planSignature = (plan: ProofPlan): string =>
  plan.steps
    .map(
      (s) =>
        `${s.reasonName}:${s.conclusionFn}:${s.proofDepTypes.join(",")}:${s.diagramDepTypes.join(",")}`,
    )
    .join("|");

/** Merge dependency sub-plans left-to-right so later slots see earlier planned steps. */
const chainDependencyPlans = (
  proofDepTypes: string[],
  depth: number,
  planPrefix: PlanStep[],
  parentReason: { reasonName: string; conclusionFn: string },
  plansForSubgoal: (
    subgoalFn: string,
    depth: number,
    prefix: PlanStep[],
    occurrence: number,
    parent?: ParentSlotContext,
  ) => ProofPlan[],
  maxChildPlans: number,
  goal: Stmt,
): ProofPlan[] => {
  let acc: ProofPlan[] = [{ steps: [] }];
  for (let depIndex = 0; depIndex < proofDepTypes.length; depIndex++) {
    const depType = proofDepTypes[depIndex];
    const depOccurrence = proofDepTypes
      .slice(0, depIndex)
      .filter((key) => key === depType).length;
    const next: ProofPlan[] = [];
    for (const partial of acc) {
      const prefix = [...planPrefix, ...partial.steps];
      const childPlans = prunePlans(
        plansForSubgoal(depType, depth + 1, prefix, depOccurrence, {
          reasonName: parentReason.reasonName,
          conclusionFn: parentReason.conclusionFn,
          depKey: depType,
          goal,
        }),
        maxChildPlans,
      );
      for (const child of childPlans) {
        next.push({ steps: [...partial.steps, ...child.steps] });
      }
    }
    acc = prunePlans(next, maxChildPlans);
    if (!acc.length) return [];
  }
  return acc;
};

const appendStep = (plans: ProofPlan[], step: PlanStep): ProofPlan[] =>
  plans.map((plan) => ({ steps: [...plan.steps, step] }));

export type BuildProofPlansOpts = {
  /** Maximum number of proof rows in a plan (not recursion depth). */
  maxDepth: number;
  maxPlans: number;
  /** Cap child plans per dependency slot before cartesian merge (bounds search). */
  maxChildPlans?: number;
  /** Record up to this many distinct candidate chains (discovery order) for logging. */
  logChainsMax?: number;
  /** Keep only the first complete plan (after quality sort). */
  stopAfterFirstPlan?: boolean;
  /** Allow `cpctc` backward for `con_seg` / `con_ang` dependency slots. */
  allowCpctcForCongruentParts?: boolean;
  /**
   * Invoked each time a new complete root plan is found (deduped by skeleton).
   * Return true to stop backward enumeration (e.g. forward pass already solved).
   */
  onNewCompleteRootPlan?: (plan: ProofPlan) => boolean;
};

export type BuildProofPlansStats = {
  reasonsTried: number;
  plansGenerated: number;
};

/** One backward reasoning chain for stats / debug logs. */
export type ProofPlanChainRecord = {
  reasons: string;
  dependencies: string;
  conclusion: string;
};

export type BuildProofPlansResult = {
  plans: ProofPlan[];
  stats: BuildProofPlansStats;
  chains: ProofPlanChainRecord[];
};

/** Semicolon-separated log row: reason chain; dependency slots; conclusion. */
export const formatPlanChainLogRow = (
  plan: ProofPlan,
  goal: Stmt,
): string => {
  const reasons = plan.steps.length
    ? plan.steps.map((step) => step.reasonName).join(" -> ")
    : "(satisfied)";
  const dependencies = plan.steps.length
    ? plan.steps
        .map((step) => {
          const proof = step.proofDepTypes.length
            ? step.proofDepTypes.join(",")
            : "—";
          const diag = step.diagramDepTypes.length
            ? `d:${step.diagramDepTypes.join(",")}`
            : "";
          return diag ? `${proof} ${diag}`.trim() : proof;
        })
        .join(" | ")
    : "";
  const conclusion = plan.steps.length
    ? plan.steps[plan.steps.length - 1].conclusionFn
    : stmtToString(goal);
  return [reasons, dependencies, conclusion]
    .map((part) => part.replace(/\s+/g, " ").trim())
    .join(";");
};

/** Lower is better when ordering plans to try in the forward pass. */
export const planQuality = (plan: ProofPlan): number => {
  let score = plan.steps.length * 10;
  score += plan.steps.reduce(
    (sum, step) => sum + reasonPriority(step.reasonName),
    0,
  );
  const names = plan.steps.map((step) => step.reasonName);
  score += (names.length - new Set(names).size) * 15;
  const hasProofDeps = plan.steps.some((step) => step.proofDepTypes.length > 0);
  if (hasProofDeps) {
    score +=
      plan.steps.filter((step) => step.proofDepTypes.length === 0).length * 5;
  }
  const chain = names.join("->");
  if (chain === "reflex_a->asa->cpctc") score -= 40;
  if (chain === "reflex_s->asa->cpctc") score -= 20;
  return score;
};

const prunePlans = (plans: ProofPlan[], limit: number): ProofPlan[] =>
  [...plans]
    .sort(
      (left, right) =>
        planQuality(left) - planQuality(right) ||
        left.steps.length - right.steps.length,
    )
    .slice(0, limit);

const MAX_RECURSION = 24;
const MAX_REASON_EXPANSIONS = 50_000;

/**
 * Backward chaining from `goal`: enumerate proof plans (reason skeletons) shortest-first.
 * Subgoals already established in `proof` contribute no steps.
 */
export const buildProofPlans = (
  goal: Stmt,
  proof: ProofObj,
  opts: BuildProofPlansOpts,
): BuildProofPlansResult => {
  const reasons = loadReasonDefinitions();
  const { statements, groups } = loadStatementDefinitions();
  const index = buildReasonIndex(reasons);
  const budget = geometryBudget(proof);
  const premiseCtx = buildPremises(proof);
  const allowCpctcForCongruentParts = opts.allowCpctcForCongruentParts ?? false;
  const stopAfterFirstPlan = opts.stopAfterFirstPlan ?? false;
  const maxChildPlans = stopAfterFirstPlan
    ? 1
    : (opts.maxChildPlans ?? 16);
  const effectiveMaxPlans = stopAfterFirstPlan
    ? 1
    : opts.maxPlans;
  const seen = new Set<string>();
  const chainSeen = new Set<string>();
  const out: ProofPlan[] = [];
  const chains: ProofPlanChainRecord[] = [];
  const memo = new Map<string, ProofPlan[]>();
  const logChainsMax = opts.logChainsMax ?? 0;
  let reasonsTried = 0;
  const forwardRootTried = new Set<string>();
  const pendingForwardRoot: ProofPlan[] = [];
  const searchAborted = { v: false };

  /** Shallow reflex rows conclude a type, not a specific goal instance. */
  const isShallowReflexOnlyPlan = (plan: ProofPlan) => {
    if (plan.steps.length !== 1) return false;
    const only = plan.steps[0]!;
    return (
      (only.reasonName === "reflex_s" || only.reasonName === "reflex_a") &&
      only.conclusionFn === goal.function
    );
  };

  const isCompletePlan = (plan: ProofPlan) => {
    if (plan.steps.length === 0) return true;
    const last = plan.steps[plan.steps.length - 1];
    if (last?.conclusionFn !== goal.function) return false;
    return !isShallowReflexOnlyPlan(plan);
  };

  const tryForwardIfRootComplete = (
    plan: ProofPlan,
    depth: number,
    subgoalFn: string,
  ): boolean => {
    if (!opts.onNewCompleteRootPlan || searchAborted.v) return false;
    if (depth !== 0 || subgoalFn !== goal.function) return false;
    if (!isCompletePlan(plan)) return false;
    const sig = planSignature(plan);
    if (forwardRootTried.has(sig)) return false;
    forwardRootTried.add(sig);
    pendingForwardRoot.push(plan);
    return false;
  };

  const flushPendingForwardRoot = () => {
    if (!opts.onNewCompleteRootPlan || searchAborted.v) return;
    const ordered = [...pendingForwardRoot].sort(
      (left, right) =>
        planQuality(left) - planQuality(right) ||
        left.steps.length - right.steps.length,
    );
    for (const plan of ordered) {
      if (opts.onNewCompleteRootPlan(plan)) {
        searchAborted.v = true;
        return;
      }
    }
  };

  const tryLogChain = (plan: ProofPlan) => {
    if (chains.length >= logChainsMax) return;
    const sig = planSignature(plan);
    if (chainSeen.has(sig)) return;
    chainSeen.add(sig);
    chains.push({
      reasons: plan.steps.length
        ? plan.steps.map((step) => step.reasonName).join(" -> ")
        : "(satisfied)",
      dependencies: plan.steps.length
        ? plan.steps
            .map((step) => {
              const proof = step.proofDepTypes.length
                ? step.proofDepTypes.join(",")
                : "—";
              const diag = step.diagramDepTypes.length
                ? `d:${step.diagramDepTypes.join(",")}`
                : "";
              return diag ? `${proof} ${diag}`.trim() : proof;
            })
            .join(" | ")
        : "",
      conclusion: plan.steps.length
        ? plan.steps[plan.steps.length - 1].conclusionFn
        : stmtToString(goal),
    });
  };

  const collect = (plans: ProofPlan[]) => {
    for (const plan of plans) {
      if (!isCompletePlan(plan)) continue;
      const sig = planSignature(plan);
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(plan);
      if (stopAfterFirstPlan && out.length >= 1) return true;
      if (out.length >= effectiveMaxPlans) return true;
    }
    return false;
  };

  const withinStepBudget = (plan: ProofPlan) =>
    plan.steps.length <= opts.maxDepth;

  const plansForSubgoal = (
    subgoalFn: string,
    depth: number,
    planPrefix: PlanStep[],
    target?: Stmt,
    occurrence = 0,
    parent?: ParentSlotContext,
  ): ProofPlan[] => {
    if (reasonsTried >= MAX_REASON_EXPANSIONS) return [];
    if (depth > MAX_RECURSION) return [];
    if (searchAborted.v) return [];

    const prefixCounts = countEstablishedConclusions(proof, planPrefix);
    const memoKey = [
      subgoalFn,
      depth,
      occurrence,
      targetKey(target),
      parent?.reasonName ?? "",
      quotaSignature(prefixCounts),
    ].join("|");
    const cached = memo.get(memoKey);
    if (cached) return cached;

    const finish = (plans: ProofPlan[]) => {
      const pruned = prunePlans(
        plans.filter(withinStepBudget),
        maxChildPlans,
      );
      memo.set(memoKey, pruned);
      return pruned;
    };

    if (target) {
      if (
        proof.steps.some(
          (step) =>
            step.statement && statementsEquivalent(step.statement, target),
        )
      ) {
        const empty: ProofPlan = { steps: [] };
        if (tryForwardIfRootComplete(empty, depth, subgoalFn)) {
          return finish([]);
        }
        return finish([{ steps: [] }]);
      }
    } else if (
      !depSlotNeedsPlan(
        proof,
        groups,
        subgoalFn,
        occurrence,
        target,
        parent,
        premiseCtx,
      )
    ) {
      const empty: ProofPlan = { steps: [] };
      if (tryForwardIfRootComplete(empty, depth, subgoalFn)) {
        return finish([]);
      }
      return finish([{ steps: [] }]);
    }

    const geoKey = CONCLUSION_BUDGET_KEY[subgoalFn];
    if (
      geoKey &&
      !target &&
      (prefixCounts.get(subgoalFn) ?? 0) >= budget[geoKey]
    ) {
      return finish([]);
    }

    let reasonNames = reasonNamesForSubgoal(subgoalFn, index, groups).sort(
      (left, right) =>
        reasonPriority(left) - reasonPriority(right) ||
        left.localeCompare(right),
    );
    if (
      parent?.reasonName === "asa" &&
      subgoalFn === "congruent_angs" &&
      proof.premises.angles.length === 1
    ) {
      reasonNames = reasonNames.filter((name) => name !== "reflex_s");
    }
    /** Under a geometry-checked parent slot, prefer cpctc over diagram-only angle rows. */
    const skipShallowRule = (
      reasonName: string,
      proofDepTypes: string[],
      parent?: ParentSlotContext,
    ) => {
      if (proofDepTypes.length > 0) return false;
      if (
        !parent ||
        !getParentDepSlotCheck(parent.reasonName, parent.depKey)
      ) {
        return false;
      }
      return (
        reasonNames.includes("cpctc") &&
        (reasonName === "vert_ang" || reasonName === "reflex_a")
      );
    };

    const candidates: ProofPlan[] = [];

    for (const name of reasonNames) {
      if (searchAborted.v) break;
      const reason = reasons.get(name);
      if (!reason) continue;
      if (
        !backwardRuleAllowed(
          reason,
          subgoalFn,
          proof,
          planPrefix,
          groups,
          goal.function,
          allowCpctcForCongruentParts,
          statements,
        )
      ) {
        continue;
      }
      if (
        reason.diagramDependencies?.some(
          (dep) => !hasDiag(proof, dep, groups),
        )
      ) {
        continue;
      }

      const heads = conclusions(reason).filter((fn) =>
        conclusionMatchesSubgoal(fn, subgoalFn, groups),
      );
      if (!heads.length) continue;

      reasonsTried += 1;

      const proofDepTypes = reason.dependencies.map((dep) => depName(dep));
      const diagramDepTypes = (reason.diagramDependencies ?? []).map((dep) =>
        depName(dep),
      );

      if (skipShallowRule(name, proofDepTypes, parent)) continue;

      for (const conclusionFn of heads) {
        if (searchAborted.v) break;
        const merged = chainDependencyPlans(
          proofDepTypes,
          depth,
          planPrefix,
          { reasonName: name, conclusionFn },
          (depType, childDepth, prefix, depOccurrence, childParent) =>
            plansForSubgoal(
              depType,
              childDepth,
              prefix,
              undefined,
              depOccurrence,
              childParent,
            ),
          maxChildPlans,
          goal,
        );
        if (!merged.length) continue;
        for (const partial of merged) {
          if (searchAborted.v) break;
          if (
            name === "altint" &&
            partial.steps.some((step) => step.reasonName === "altint_conv")
          ) {
            continue;
          }
          const prior = [...planPrefix, ...partial.steps];
          if (
            !canAppendPlanStep(name, conclusionFn, proof, prior, budget)
          ) {
            continue;
          }
          const step: PlanStep = {
            reasonName: name,
            conclusionFn,
            proofDepTypes,
            diagramDepTypes,
          };
          const plan: ProofPlan = { steps: [...partial.steps, step] };
          tryLogChain({ steps: [...planPrefix, ...plan.steps] });
          candidates.push(plan);
          if (tryForwardIfRootComplete(plan, depth, subgoalFn)) {
            return finish(candidates);
          }
        }
      }
    }

    return finish(candidates);
  };

  const rootPlans = plansForSubgoal(goal.function, 0, [], goal).sort(
    (left, right) =>
      planQuality(left) - planQuality(right) ||
      left.steps.length - right.steps.length,
  );
  collect(rootPlans);
  flushPendingForwardRoot();

  const plans = out.sort(
    (left, right) =>
      planQuality(left) - planQuality(right) ||
      left.steps.length - right.steps.length,
  );
  return {
    plans,
    stats: { reasonsTried, plansGenerated: plans.length },
    chains,
  };
};
