import { ProofContent } from "geometry-object";
import {
  ProofGraph,
  ProofStep,
  ReasonDefinition,
  StatementGroup,
  Stmt,
} from "../../types/checkerTypes";
import { checkReasonApplication } from "../reasonApplication";
import { canonicalKey } from "./canonical";
import { FactIndex, FactRecord } from "./factIndex";
import {
  DepCandidate,
  depsFromConclusion,
  GeneratorInput,
} from "./depsFromConclusion";

/**
 * Dependency auto-fill kernel: given a reason and a concrete conclusion
 * statement, derive the expected dependency statements (per-reason
 * generators), hash-look them up among known facts, and confirm complete
 * assignments with a single `checkReasonApplication` call each. This inverts
 * the old enumerate-then-check flow (`computeWaysToProve`'s 4000-combo sweep)
 * into derive-then-lookup.
 */

/** A fully resolved, geometrically confirmed dependency assignment. */
export interface DepFill {
  /** Citation refs in the reason's slot order, ready for `reason.arguments`. */
  refs: string[];
  /** Diagram premise refs consumed by the reason check (informational). */
  diagramRefs: string[];
  /** The dependency statements behind each ref, slot order. */
  depStmts: Stmt[];
}

export interface MissingDep {
  slot: number;
  expectedType: string;
  /** Concrete subgoal statement that would fill the slot. */
  expectedStmt: Stmt;
}

/** A candidate whose slots resolved only partially: the rest are subgoals. */
export interface PartialFill {
  filled: Array<FactRecord | null>;
  missing: MissingDep[];
  /** All candidate dependency statements, slot order. */
  deps: Stmt[];
}

export interface FillDepsResult {
  complete: DepFill[];
  partial: PartialFill[];
  /**
   * Fully resolved assignments that failed the geometric check. Some checks
   * read state written by earlier checks (triangle correspondence set by
   * `orderTri`), so a caller that can replay a dependency's own derivation
   * may retry these.
   */
  failedComplete: Array<{ refs: string[]; depStmts: Stmt[] }>;
}

export interface FillDepsInput {
  reason: string;
  /** The conclusion statement whose dependencies are being filled. */
  statement: Stmt;
  facts: FactIndex;
  ctx: ProofContent;
  /**
   * Graph used to resolve refs during verification. Must contain every fact
   * in `facts` as a node (ref → step with statement) plus diagram premises.
   */
  graph: ProofGraph;
  reasonDefs: Map<string, ReasonDefinition>;
  groups: Map<string, StatementGroup>;
  /** Incremented once per checkReasonApplication call (cost accounting). */
  onCheckerCall?: () => void;
  /** Cap on generic-fallback dependency combos per reason (default 100). */
  fallbackComboCap?: number;
}

/** Expand an expected dependency type into acceptable statement functions. */
export const expandDepType = (
  expected: string | StatementGroup,
  groups: Map<string, StatementGroup>,
): string[] => {
  const name = typeof expected === "string" ? expected : expected.name;
  const group = groups.get(name);
  if (group) return [group.base, ...group.extensions];
  return [name];
};

/** Build a trial step and run the geometric reason check once. */
export const verifyReasonStep = (
  reason: string,
  depRefs: string[],
  statement: Stmt,
  graph: ProofGraph,
  ctx: ProofContent,
  reasonDefs: Map<string, ReasonDefinition>,
): { ok: boolean; diagramRefs: string[] } => {
  const trialStep: ProofStep = {
    type: "proof",
    reason: { function: reason, arguments: depRefs },
    statement,
    errors: [],
    diagramDeps: undefined,
  };
  const ok = checkReasonApplication(trialStep, reasonDefs, graph, ctx);
  const diagramRefs = ok
    ? (trialStep.diagramDeps ?? []).map((d) => d.stepNumber)
    : [];
  return { ok, diagramRefs };
};

/**
 * Generic fallback for reasons without a bespoke generator: enumerate slot
 * fills directly from the fact index, preferring facts that share an object
 * with the conclusion. Produces complete candidates only (it cannot invent
 * subgoal statements).
 */
const fallbackCandidates = (
  definition: ReasonDefinition,
  input: GeneratorInput,
  groups: Map<string, StatementGroup>,
  cap: number,
): DepCandidate[] => {
  const { conclusion, ctx, facts } = input;
  const conclusionObjs = new Set(
    conclusion.arguments.flatMap((a) => a.v.split("")),
  );
  const pools = definition.dependencies.map((dep) => {
    const fns = expandDepType(dep, groups);
    const all = facts.byFunction(fns);
    const related = all.filter((f) =>
      f.stmt.arguments.some((a) =>
        a.v.split("").some((c) => conclusionObjs.has(c)),
      ),
    );
    const pool = related.length > 0 ? related : all;
    return pool.slice(0, 12);
  });
  let combos: FactRecord[][] = [[]];
  for (const pool of pools) {
    const next: FactRecord[][] = [];
    for (const partial of combos) {
      for (const f of pool) {
        if (partial.some((p) => p.key === f.key)) continue;
        next.push([...partial, f]);
        if (next.length >= cap) break;
      }
      if (next.length >= cap) break;
    }
    combos = next;
    if (combos.length === 0) break;
  }
  return combos.map((records) => ({ deps: records.map((r) => r.stmt) }));
};

/**
 * Fill the dependency slots of `reason` for concluding `statement`.
 *
 * `complete` entries passed the geometric check and can be cited as-is;
 * `partial` entries carry concrete subgoal statements (`missing[].expectedStmt`)
 * that a solver can recurse on, after which the same candidate can be
 * re-resolved and verified.
 */
export const fillDeps = (input: FillDepsInput): FillDepsResult => {
  const {
    reason,
    statement,
    facts,
    ctx,
    graph,
    reasonDefs,
    groups,
    onCheckerCall,
    fallbackComboCap = 100,
  } = input;

  const definition = reasonDefs.get(reason);
  const result: FillDepsResult = { complete: [], partial: [], failedComplete: [] };
  if (!definition) return result;

  const generatorInput: GeneratorInput = {
    conclusion: statement,
    ctx,
    facts,
    diagrams: [...graph.diagramPremises.values()],
  };

  const candidates =
    depsFromConclusion(reason, generatorInput) ??
    fallbackCandidates(definition, generatorInput, groups, fallbackComboCap);

  const slotTypes = definition.dependencies.map((dep) =>
    expandDepType(dep, groups),
  );
  const seenComplete = new Set<string>();

  for (const candidate of candidates) {
    if (candidate.deps.length !== slotTypes.length) continue;

    // Reject candidates citing the same statement in two slots (the checker's
    // duplicate-dependency rule would fail the emitted step).
    const depKeys = candidate.deps.map((d) => canonicalKey(d, ctx));
    if (new Set(depKeys).size !== depKeys.length) continue;

    const filled: Array<FactRecord | null> = [];
    const missing: MissingDep[] = [];
    candidate.deps.forEach((dep, slot) => {
      const record = facts.findMatching(dep, slotTypes[slot]) ?? null;
      filled.push(record);
      if (!record) {
        missing.push({
          slot,
          expectedType:
            typeof definition.dependencies[slot] === "string"
              ? (definition.dependencies[slot] as string)
              : (definition.dependencies[slot] as StatementGroup).name,
          expectedStmt: dep,
        });
      }
    });

    if (missing.length > 0) {
      result.partial.push({ filled, missing, deps: candidate.deps });
      continue;
    }

    const refs = (filled as FactRecord[]).map((f) => f.ref);
    // The same ref in two slots is also a duplicate citation.
    if (new Set(refs).size !== refs.length) continue;
    const comboKey = refs.join(",");
    if (seenComplete.has(comboKey)) continue;
    seenComplete.add(comboKey);

    onCheckerCall?.();
    const verdict = verifyReasonStep(
      reason,
      refs,
      statement,
      graph,
      ctx,
      reasonDefs,
    );
    if (verdict.ok) {
      result.complete.push({
        refs,
        diagramRefs: verdict.diagramRefs,
        depStmts: (filled as FactRecord[]).map((f) => f.stmt),
      });
    } else {
      result.failedComplete.push({
        refs,
        depStmts: (filled as FactRecord[]).map((f) => f.stmt),
      });
    }
  }

  return result;
};
