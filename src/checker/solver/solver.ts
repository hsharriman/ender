import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { buildPremises } from "../checker/premises";
import { stmtKey } from "../checker/reasonChecks/utils";
import { REASONS_DEFS } from "../grammar/defs/reasons.defs";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "../grammar/defsParsers";
import { runProofChecker } from "../proofChecker";
import { stmtToString } from "../proofToString";
import {
  ParseDiagramStmt,
  ProofObj,
  ProofStep,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
  Stmt,
} from "../types/checkerTypes";
import { buildProofDag, prettyPrintProofDag } from "./proofDag";
import {
  SolverAttempt,
  SolverOpts,
  SolverResult,
  SolverState,
  SolverStep,
} from "./types";

const UNSAFE_REASONS = new Set([
  "given",
  "perp_con_ang",
  "paralellogram1",
  "paralellogram2",
  "equilateral",
  "aaa",
]);

const DEFINED_REASONS = new Set(
  Object.keys(REASONS_DEFS).filter((reason) => !UNSAFE_REASONS.has(reason)),
);

type Pool = Map<ParseObj["type"], ParseObj[]>;
type ReasonChoice = {
  name: string;
  reason: ReasonDefinition;
  fulfilled: number;
  total: number;
};

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
  content.angles.forEach((angle) => addObj(pool, Obj.Angle, angle.label));
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
  return refs.length || reason.diagramDependencies?.length || pool.size > 0
    ? pool
    : objectPool(ctx);
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
  const fns = depFns(depName(dep), groups);
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

const maxFulfilledSlots = (slots: string[][]) => {
  const ordered = [...slots].sort((left, right) => left.length - right.length);

  const walk = (index: number, used: Set<string>): number => {
    if (index === ordered.length) return 0;
    let best = walk(index + 1, used);
    for (const ref of ordered[index]) {
      if (used.has(ref)) continue;
      used.add(ref);
      best = Math.max(best, 1 + walk(index + 1, used));
      used.delete(ref);
    }
    return best;
  };

  return walk(0, new Set());
};

const fulfilledDeps = (
  reason: ReasonDefinition,
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
  facts: Map<string, string[]>,
) => {
  const proofDeps = maxFulfilledSlots(depRefSlots(reason, groups, facts));
  const diagramDeps =
    reason.diagramDependencies?.filter((dep) => hasDiag(proof, dep, groups))
      .length ?? 0;
  return proofDeps + diagramDeps;
};

const reasonChoices = (
  reasons: Map<string, ReasonDefinition>,
  proof: ProofObj,
  groups: Map<string, StatementGroup>,
): ReasonChoice[] => {
  const facts = factMap(proof);
  const choices = [...reasons]
    .filter(([name]) => DEFINED_REASONS.has(name))
    .map(([name, reason]) => {
      const total =
        reason.dependencies.length + (reason.diagramDependencies?.length ?? 0);
      return {
        name,
        reason,
        fulfilled: fulfilledDeps(reason, proof, groups, facts),
        total,
      };
    });
  const ready = choices.filter(
    ({ fulfilled, total }) => total > 0 && fulfilled === total,
  );
  const zeroDep = choices.filter(({ total }) => total === 0);
  const selected = ready.length ? [...ready, ...zeroDep] : zeroDep;

  return selected.sort(
    (left, right) =>
      right.fulfilled - left.fulfilled ||
      right.total - left.total ||
      left.name.localeCompare(right.name),
  );
};

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

const stepSignature = (step: ProofStep) =>
  JSON.stringify({
    reason: step.reason?.function,
    reasonArgs: step.reason?.arguments,
    statement: step.statement ? stmtKey(step.statement) : "",
  });

const stateSignature = (proof: ProofObj) =>
  proof.steps
    .filter((step) => step.type !== "goal")
    .map(stepSignature)
    .sort((left, right) => left.localeCompare(right))
    .join("\n");

const nextStepNumber = (proof: ProofObj) => {
  const nums = proof.steps
    .filter(
      (step) => step.type === "proof" && /^\d+$/.test(step.stepNumber ?? ""),
    )
    .map((step) => parseInt(step.stepNumber!, 10));
  return `${Math.max(0, ...nums) + 1}`;
};

const addStep = (proof: ProofObj, step: SolverStep): ProofObj => ({
  ...clone(proof),
  steps: [...clone(proof.steps), step],
});

const statementExists = (proof: ProofObj, statement: Stmt) =>
  proof.steps.some(
    (step) => step.statement && statementsEquivalent(step.statement, statement),
  );

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

export const genSteps = (
  proof: ProofObj,
  ctx: ProofContent,
  goal?: Stmt,
): SolverStep[] => {
  const reasons = loadReasonDefinitions();
  const { statements, groups } = loadStatementDefinitions();
  const nextNumber = nextStepNumber(proof);
  const steps: SolverStep[] = [];

  for (const { name, reason } of reasonChoices(reasons, proof, groups)) {
    const reasonSteps: SolverStep[] = [];
    const refs = refCombinations(reason, proof, groups);
    if (reason.dependencies.length > 0 && refs.length === 0) continue;
    const dependencySets = reason.dependencies.length === 0 ? [[]] : refs;
    for (const deps of dependencySets) {
      const pool = scopedPool(proof, ctx, reason, deps, groups);
      for (const fn of conclusions(reason)) {
        if (fn.startsWith("__")) continue;
        for (const statement of statementsFor(fn, statements, pool, goal)) {
          if (statementExists(proof, statement)) continue;
          reasonSteps.push(makeStep(nextNumber, name, deps, statement));
        }
      }
    }
    steps.push(
      ...reasonSteps.sort((left, right) =>
        stepSignature(left).localeCompare(stepSignature(right)),
      ),
    );
  }

  return steps;
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

const trialPassed = (
  result: ReturnType<typeof runProofChecker>,
  step: string,
) => startErrors(result).length === 0 && !result.graph.incorrectSteps.has(step);

export const solve = (proof: ProofObj, opts: SolverOpts = {}): SolverResult => {
  const maxDepth = opts.maxDepth ?? 4;
  const maxStates = opts.maxStates ?? 500;
  const maxCandidates = opts.maxCandidatesPerState ?? 1000;
  const seeded = seedGivenSteps(proof);
  const initial = runProofChecker(clean(seeded.proof));
  const errors = startErrors(initial);
  const attempts: SolverAttempt[] = [];
  if (errors.length) return { status: "invalid-start", errors, attempts };

  const goal = goalOf(initial.proof);
  if (!goal)
    return { status: "invalid-start", errors: ["No goal found"], attempts };
  if (statementExists(initial.proof, goal))
    return {
      status: "solved",
      steps: [],
      checkedProof: initial.proof,
      dagText: prettyPrintProofDag(buildProofDag(initial.proof)),
      attempts,
    };

  const queue: SolverState[] = [
    { proof: initial.proof, steps: seeded.steps, depth: 0 },
  ];
  const seenStates = new Set([stateSignature(initial.proof)]);
  let searched = 0;
  let depth = 0;

  while (queue.length) {
    if (searched >= maxStates)
      return { status: "capped", searched, depth, attempts };
    const state = queue.shift()!;
    searched++;
    depth = Math.max(depth, state.depth);
    if (state.depth >= maxDepth) continue;

    const ctx = buildPremises(state.proof);
    ctx.checkAngleOverlaps();
    for (const candidate of genSteps(state.proof, ctx, goal).slice(
      0,
      maxCandidates,
    )) {
      const trial = runProofChecker(clean(addStep(state.proof, candidate)));
      const candidateErrors = startErrors(trial);
      const passed =
        candidateErrors.length === 0 &&
        !trial.graph.incorrectSteps.has(candidate.stepNumber);
      attempts.push({
        depth: state.depth + 1,
        reason: candidate.reason.function,
        refs: candidate.reason.arguments,
        statement: stmtToString(candidate.statement),
        passed,
        errors: candidateErrors,
      });
      if (!passed) continue;
      const checkedStep = trial.proof.steps.find(
        (step) => step.stepNumber === candidate.stepNumber,
      );
      const step = (checkedStep ?? candidate) as SolverStep;
      const steps = [...state.steps, step];
      if (statementsEquivalent(step.statement, goal)) {
        return {
          status: "solved",
          steps,
          checkedProof: trial.proof,
          dagText: prettyPrintProofDag(buildProofDag(trial.proof)),
          attempts,
        };
      }
      const signature = stateSignature(trial.proof);
      if (seenStates.has(signature)) continue;
      seenStates.add(signature);
      queue.push({ proof: trial.proof, steps, depth: state.depth + 1 });
    }
  }

  return { status: "not-found", searched, depth, attempts };
};

export const __solverTest = { argCombinations, objectPool, statementsFor };
