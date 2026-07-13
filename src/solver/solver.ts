import { canonicalKey } from "checker/checker/fillDeps/canonical";
import { FactIndex } from "checker/checker/fillDeps/factIndex";
import { UNIMPLEMENTED_REASONS } from "checker/checker/fillDeps/depsFromConclusion";
import { fillDeps, verifyReasonStep } from "checker/checker/fillDeps/fillDeps";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "checker/grammar/defsParsers";
import { ProofParser } from "checker/grammar/lezerParser";
import {
  collectProofCheckerIssues,
  runProofChecker,
  runProofCheckerFromText,
} from "checker/proofChecker";
import {
  ProofGraph,
  ProofObj,
  ReasonDefinition,
  StatementGroup,
  Stmt,
} from "checker/types/checkerTypes";
import { ProofContent } from "geometry-object";
import { buildProofText, pad2, premisesSection, stmtToText } from "./proofText";
import {
  Solution,
  SolutionStep,
  SolutionTreeJson,
  SolverDerivation,
  SolverFact,
  SolverOptions,
  SolverResult,
  SolverStats,
} from "./solverTypes";

/**
 * Backward-chaining proof solver.
 *
 * Phase 0: run the full checker once on the input — build geometry, seed the
 * fact base with given/diagram premises and every already-valid step.
 * Phase 1: backward-chain from the goal. For each subgoal, `fillDeps` derives
 * expected dependency statements per reason, resolves them against the fact
 * base, and confirms complete assignments with one `checkReasonApplication`
 * each; unresolved dependencies recurse as subgoals (OPEN-state memo guards
 * cycles). Every distinct (reason, deps) that closes a fact is recorded — the
 * fact base becomes an AND-OR derivation graph.
 * Phase 2: extract distinct proofs by choosing one derivation per fact,
 * renumber, and re-run the full checker on each emitted candidate (the only
 * place the full pipeline runs after phase 0 — correctness is absolute
 * regardless of solver bugs).
 */

const DEFAULTS: Required<SolverOptions> = {
  maxSolutions: 3,
  maxDepth: 8,
  maxCheckerCalls: 20000,
  timeLimitMs: 12000,
  maxDerivationsPerFact: 8,
  maxExtractionCombos: 96,
};

/** One reason may not fill a fact's whole derivation budget (diversity). */
const MAX_DERIVATIONS_PER_REASON = 2;

class BudgetExceeded extends Error {}

interface MemoEntry {
  state: "open" | "closed" | "failed";
  /** Depth at which the failed attempt started (retry only from shallower). */
  failedAtDepth?: number;
}

/** Step-number-error codes that still allow premise-only seeding. */
const STEP_NUMBER_CODES = new Set([
  "no_step_numbers",
  "non_consecutive_step_numbers",
  "duplicate_step_number",
  "invalid_step_number_labels",
]);

const emptyStats = (): SolverStats => ({
  totalMs: 0,
  seedMs: 0,
  searchMs: 0,
  extractMs: 0,
  verifyMs: 0,
  checkerCalls: 0,
  fullCheckerRuns: 0,
  factsCreated: 0,
  derivationsRecorded: 0,
  subgoalsOpened: 0,
  memoHits: 0,
  solutionsExtracted: 0,
  solutionsVerified: 0,
  budgetExhausted: false,
});

/** reason names by conclusion statement function, placeholders excluded. */
const reasonsByConclusion = (
  reasonDefs: Map<string, ReasonDefinition>,
): Map<string, string[]> => {
  const index = new Map<string, string[]>();
  reasonDefs.forEach((def, name) => {
    if (name === "given" || UNIMPLEMENTED_REASONS.has(name)) return;
    for (const fn of def.conclusion.split(",").map((c) => c.trim())) {
      const list = index.get(fn);
      if (list) list.push(name);
      else index.set(fn, [name]);
    }
  });
  return index;
};

class SolverEngine {
  private factsByKey = new Map<string, SolverFact>();
  private factById = new Map<string, SolverFact>();
  private factByRef = new Map<string, SolverFact>();
  private memo = new Map<string, MemoEntry>();
  private nextFactNum = 0;
  readonly factIndex: FactIndex;
  readonly graph: ProofGraph;
  private readonly conclusionIndex: Map<string, string[]>;
  private readonly deadline: number;

  constructor(
    private ctx: ProofContent,
    private reasonDefs: Map<string, ReasonDefinition>,
    private groups: Map<string, StatementGroup>,
    private options: Required<SolverOptions>,
    private stats: SolverStats,
    proof: ProofObj,
  ) {
    this.factIndex = new FactIndex(ctx);
    this.graph = {
      nodes: new Map(),
      diagramPremises: new Map(),
      edges: new Map(),
      incorrectSteps: new Set(),
      dependencyFailureSteps: new Set(),
      unusedSteps: new Set(),
      cycles: [],
    };
    proof.premises.diagramStatements.forEach((d) => {
      this.graph.diagramPremises.set(d.stepNumber, d);
    });
    this.conclusionIndex = reasonsByConclusion(reasonDefs);
    this.deadline = Date.now() + options.timeLimitMs;
  }

  allFacts(): SolverFact[] {
    return [...this.factById.values()];
  }

  getFact(id: string): SolverFact | undefined {
    return this.factById.get(id);
  }

  findFactForStmt(stmt: Stmt): SolverFact | undefined {
    return this.factsByKey.get(canonicalKey(stmt, this.ctx));
  }

  addFact(
    stmt: Stmt,
    source: SolverFact["source"],
    givenRef?: string,
  ): SolverFact {
    const key = canonicalKey(stmt, this.ctx);
    const existing = this.factsByKey.get(key);
    if (existing) return existing;
    const id = `F${this.nextFactNum++}`;
    const ref = source === "given" && givenRef ? givenRef : `f_${id}`;
    const fact: SolverFact = {
      id,
      ref,
      stmt,
      key,
      source,
      givenRef,
      derivations: [],
    };
    this.factsByKey.set(key, fact);
    this.factById.set(id, fact);
    this.factByRef.set(ref, fact);
    this.graph.nodes.set(ref, {
      type: source === "given" ? "given" : "proof",
      statement: stmt,
      stepNumber: ref,
      errors: [],
    });
    this.factIndex.add(ref, stmt);
    this.stats.factsCreated++;
    return fact;
  }

  addDerivation(fact: SolverFact, derivation: SolverDerivation): void {
    const key = `${derivation.reason}|${derivation.depFactIds.join(",")}`;
    const exists = fact.derivations.some(
      (d) => `${d.reason}|${d.depFactIds.join(",")}` === key,
    );
    if (exists) return;
    fact.derivations.push(derivation);
    this.stats.derivationsRecorded++;
  }

  private checkBudget(): void {
    if (Date.now() > this.deadline) throw new BudgetExceeded("time");
    if (this.stats.checkerCalls > this.options.maxCheckerCalls)
      throw new BudgetExceeded("checkerCalls");
  }

  private runFillDeps(reason: string, statement: Stmt) {
    return fillDeps({
      reason,
      statement,
      facts: this.factIndex,
      ctx: this.ctx,
      graph: this.graph,
      reasonDefs: this.reasonDefs,
      groups: this.groups,
      onCheckerCall: () => {
        this.stats.checkerCalls++;
      },
    });
  }

  private derivationFromRefs(
    reason: string,
    refs: string[],
    diagramRefs: string[],
  ): SolverDerivation | null {
    const depFactIds: string[] = [];
    for (const ref of refs) {
      const fact = this.factByRef.get(ref);
      if (!fact) return null;
      depFactIds.push(fact.id);
    }
    return { reason, depFactIds, diagramRefs };
  }

  private verify(reason: string, refs: string[], stmt: Stmt) {
    this.stats.checkerCalls++;
    return verifyReasonStep(
      reason,
      refs,
      stmt,
      this.graph,
      this.ctx,
      this.reasonDefs,
    );
  }

  /**
   * Retry a resolved-but-failed fill after replaying each dependency's own
   * derivations. Some checks (cpctc) read triangle correspondence written by
   * whichever congruence check ran last (`orderTri`); replaying a dependency
   * derivation re-establishes its state before the retry.
   */
  private retryWithReplay(
    reason: string,
    statement: Stmt,
    refs: string[],
  ): SolverDerivation | null {
    for (const ref of refs) {
      const depFact = this.factByRef.get(ref);
      if (!depFact || depFact.derivations.length === 0) continue;
      for (const derivation of depFact.derivations) {
        const depRefs = derivation.depFactIds.map(
          (id) => this.factById.get(id)?.ref ?? id,
        );
        const replay = this.verify(derivation.reason, depRefs, depFact.stmt);
        if (!replay.ok) continue;
        const retry = this.verify(reason, refs, statement);
        if (retry.ok) {
          return this.derivationFromRefs(reason, refs, retry.diagramRefs);
        }
      }
    }
    return null;
  }

  /**
   * Prove `stmt`, returning its fact (with every derivation found within
   * caps) or null. `stmt` is stored verbatim on the fact, so callers control
   * the emitted spelling (e.g. the literal goal text).
   */
  prove(stmt: Stmt, depth: number): SolverFact | null {
    const key = canonicalKey(stmt, this.ctx);
    const known = this.factsByKey.get(key);
    if (known) return known;

    const memo = this.memo.get(key);
    if (memo) {
      if (memo.state === "open") return null; // cycle guard
      if (memo.state === "failed") {
        // Retry only when we now have more remaining depth than the attempt
        // that failed.
        if (depth >= (memo.failedAtDepth ?? 0)) {
          this.stats.memoHits++;
          return null;
        }
      }
    }
    if (depth >= this.options.maxDepth) return null;
    this.checkBudget();

    this.memo.set(key, { state: "open" });
    this.stats.subgoalsOpened++;

    const derivations: SolverDerivation[] = [];
    const seenDerivations = new Set<string>();
    const reasons = this.conclusionIndex.get(stmt.function) ?? [];
    const maxDerivations = this.options.maxDerivationsPerFact;

    for (const reason of reasons) {
      if (derivations.length >= maxDerivations) break;
      this.checkBudget();

      let byThisReason = 0;
      const room = () =>
        derivations.length < maxDerivations &&
        byThisReason < MAX_DERIVATIONS_PER_REASON;
      const record = (derivation: SolverDerivation | null) => {
        if (!derivation) return;
        const key = `${derivation.reason}|${derivation.depFactIds.join(",")}`;
        if (seenDerivations.has(key)) return;
        seenDerivations.add(key);
        derivations.push(derivation);
        byThisReason++;
      };
      const harvest = (fills: ReturnType<typeof this.runFillDeps>) => {
        for (const fill of fills.complete) {
          if (!room()) return;
          record(
            this.derivationFromRefs(reason, fill.refs, fill.diagramRefs),
          );
        }
        for (const failed of fills.failedComplete) {
          if (!room()) return;
          record(this.retryWithReplay(reason, stmt, failed.refs));
        }
      };

      const fills = this.runFillDeps(reason, stmt);
      harvest(fills);
      if (!room()) continue;

      // Recurse on subgoal candidates, fewest missing slots first.
      const partials = fills.partial
        .slice()
        .sort((a, b) => a.missing.length - b.missing.length)
        .slice(0, 24);
      let anySubgoalProved = false;
      for (const partial of partials) {
        for (const missing of partial.missing) {
          if (!this.prove(missing.expectedStmt, depth + 1)) break;
          anySubgoalProved = true;
        }
      }
      if (anySubgoalProved) {
        // New facts are in the index; re-resolve every candidate of this
        // reason (a candidate beyond the recursion cap may now be complete).
        harvest(this.runFillDeps(reason, stmt));
      }
    }

    if (derivations.length > 0) {
      const fact = this.addFact(stmt, "derived");
      derivations.forEach((d) => this.addDerivation(fact, d));
      this.memo.set(key, { state: "closed" });
      return fact;
    }
    this.memo.set(key, { state: "failed", failedAtDepth: depth });
    return null;
  }

  /**
   * Re-verify a derivation seeded from an existing proof step (used when the
   * seed graph could not vouch for it).
   */
  verifySeededDerivation(
    reason: string,
    depRefs: string[],
    stmt: Stmt,
  ): { ok: boolean; diagramRefs: string[] } {
    this.stats.checkerCalls++;
    return verifyReasonStep(
      reason,
      depRefs,
      stmt,
      this.graph,
      this.ctx,
      this.reasonDefs,
    );
  }
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

type Assignment = Map<string, number>;

/** Enumerate derivation-choice assignments over the goal cone (capped). */
const enumerateAssignments = (
  engine: SolverEngine,
  goalFactId: string,
  cap: number,
): Assignment[] => {
  const results: Assignment[] = [];

  const expand = (pending: string[], chosen: Assignment): void => {
    if (results.length >= cap) return;
    const nextId = pending.find(
      (id) => !chosen.has(id) && (engine.getFact(id)?.derivations.length ?? 0) > 0,
    );
    if (!nextId) {
      results.push(new Map(chosen));
      return;
    }
    const fact = engine.getFact(nextId)!;
    for (let di = 0; di < fact.derivations.length; di++) {
      if (results.length >= cap) return;
      const next = new Map(chosen);
      next.set(nextId, di);
      expand([...pending, ...fact.derivations[di].depFactIds], next);
    }
  };

  expand([goalFactId], new Map());
  return results;
};

interface ExtractedProof {
  steps: SolutionStep[];
  /**
   * Assignment key: multiset of (reason, conclusion, dep keys). Keeps
   * correspondence variants of the same step distinct — they interact with
   * stateful checks (orderTri), so the gate must be able to try each.
   */
  key: string;
  /** User-facing distinctness key: multiset of (reason, conclusion) only. */
  displayKey: string;
  derivedCount: number;
  /** Given premises cited by this candidate. */
  usedGivens: number;
}

const extractProof = (
  engine: SolverEngine,
  goalFact: SolverFact,
  assignment: Assignment,
  goal: Stmt,
): ExtractedProof | null => {
  // Topological order over the chosen derivations, givens hoisted first.
  const givens: SolverFact[] = [];
  const derived: SolverFact[] = [];
  const visited = new Set<string>();

  const visit = (fact: SolverFact): boolean => {
    if (visited.has(fact.id)) return true;
    visited.add(fact.id);
    if (fact.derivations.length === 0) {
      if (fact.source !== "given") return false; // underivable non-premise
      givens.push(fact);
      return true;
    }
    const derivation = fact.derivations[assignment.get(fact.id) ?? 0];
    for (const depId of derivation.depFactIds) {
      const dep = engine.getFact(depId);
      if (!dep || !visit(dep)) return false;
    }
    derived.push(fact);
    return true;
  };

  if (!visit(goalFact)) return null;

  const stepNumberByFactId = new Map<string, string>();
  const steps: SolutionStep[] = [];
  let n = 0;

  for (const fact of givens) {
    n++;
    stepNumberByFactId.set(fact.id, String(n));
    steps.push({
      stepNumber: String(n),
      reason: "given",
      refs: [fact.givenRef ?? ""],
      text: `[${pad2(n)}] given(${fact.givenRef}) -> ${stmtToText(fact.stmt)}`,
    });
  }
  const keyParts: string[] = [];
  const displayKeyParts: string[] = [];
  for (const fact of derived) {
    n++;
    stepNumberByFactId.set(fact.id, String(n));
    const derivation = fact.derivations[assignment.get(fact.id) ?? 0];
    const refs = derivation.depFactIds.map(
      (id) => stepNumberByFactId.get(id) ?? "?",
    );
    // The goal step must literally match the goal text for checkGoalMatch.
    const stmt = fact === goalFact ? goal : fact.stmt;
    steps.push({
      stepNumber: String(n),
      reason: derivation.reason,
      refs,
      text: `[${pad2(n)}] ${derivation.reason}(${refs.join(", ")}) -> ${stmtToText(stmt)}`,
    });
    const depKeys = derivation.depFactIds
      .map((id) => engine.getFact(id)?.key ?? id)
      .sort()
      .join(",");
    keyParts.push(`${derivation.reason}:${fact.key}<-${depKeys}`);
    displayKeyParts.push(`${derivation.reason}:${fact.key}`);
  }

  return {
    steps,
    key: keyParts.sort().join("|"),
    displayKey: displayKeyParts.sort().join("|"),
    derivedCount: derived.length,
    usedGivens: givens.length,
  };
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export const solveProof = (
  proofText: string,
  optionsIn?: SolverOptions,
): SolverResult => {
  const options: Required<SolverOptions> = { ...DEFAULTS, ...optionsIn };
  const stats = emptyStats();
  const t0 = Date.now();

  const fail = (error: string): SolverResult => ({
    ok: false,
    error,
    solutions: [],
    tree: { facts: [] },
    stats: { ...stats, totalMs: Date.now() - t0 },
    seed: {
      givens: 0,
      diagramPremises: 0,
      existingStepsSeeded: 0,
      droppedInvalidSteps: [],
    },
  });

  const parser = new ProofParser();
  const parsed = parser.parse(proofText);
  if (!parsed.ok) {
    return fail(
      `parse error: ${parsed.failure.map((f) => f.code).join(", ")}`,
    );
  }
  const proof = parsed.value;

  // Phase 0 — full checker once: geometry + validity of existing steps.
  const checkerResult = runProofChecker(proof);
  stats.fullCheckerRuns++;
  const { ctx } = checkerResult;

  if (checkerResult.errors.length > 0) {
    const onlyStepNumbering = checkerResult.errors.every((e) =>
      STEP_NUMBER_CODES.has(e.code),
    );
    if (!onlyStepNumbering) {
      return fail(
        `premises invalid: ${checkerResult.errors.map((e) => e.code).join(", ")}`,
      );
    }
  }
  const seededGraphUsable = checkerResult.errors.length === 0;

  const goal = checkerResult.goal;
  if (!goal) return fail("no goal statement found");

  const reasonDefs = loadReasonDefinitions();
  const { groups } = loadStatementDefinitions();
  const engine = new SolverEngine(
    ctx,
    reasonDefs,
    groups,
    options,
    stats,
    proof,
  );

  // Seed: given premises.
  let givens = 0;
  for (const step of proof.steps) {
    if (step.type === "given" && step.statement && step.stepNumber) {
      engine.addFact(step.statement, "given", step.stepNumber);
      givens++;
    }
  }

  // Seed: already-valid existing proof steps (drop invalid ones, reported).
  const droppedInvalidSteps: string[] = [];
  let existingSeeded = 0;
  const factByOrigRef = new Map<string, SolverFact>();
  if (seededGraphUsable) {
    for (const step of proof.steps) {
      if (step.type !== "proof" || !step.statement || !step.reason) continue;
      const num = step.stepNumber;
      if (!num) continue;
      if (
        checkerResult.graph.incorrectSteps.has(num) ||
        checkerResult.graph.dependencyFailureSteps.has(num)
      ) {
        droppedInvalidSteps.push(num);
        continue;
      }
      if (step.reason.function === "given") {
        const fact = engine.findFactForStmt(step.statement);
        if (fact) factByOrigRef.set(num, fact);
        continue;
      }
      const depFacts: SolverFact[] = [];
      let resolvable = true;
      for (const ref of step.reason.arguments) {
        const dep = factByOrigRef.get(ref) ?? engine
          .findFactForStmt(
            checkerResult.graph.nodes.get(ref)?.statement ?? {
              function: "__missing__",
              arguments: [],
            },
          );
        if (!dep) {
          resolvable = false;
          break;
        }
        depFacts.push(dep);
      }
      if (!resolvable) {
        droppedInvalidSteps.push(num);
        continue;
      }
      // Re-verify against the synthetic graph so search-time citations of
      // this fact stand on checked ground.
      const verdict = engine.verifySeededDerivation(
        step.reason.function,
        depFacts.map((f) => f.ref),
        step.statement,
      );
      if (!verdict.ok) {
        droppedInvalidSteps.push(num);
        continue;
      }
      const fact = engine.addFact(step.statement, "existing");
      engine.addDerivation(fact, {
        reason: step.reason.function,
        depFactIds: depFacts.map((f) => f.id),
        diagramRefs: verdict.diagramRefs,
      });
      factByOrigRef.set(num, fact);
      existingSeeded++;
    }
  } else {
    for (const step of proof.steps) {
      if (step.type === "proof" && step.stepNumber) {
        droppedInvalidSteps.push(step.stepNumber);
      }
    }
  }
  stats.seedMs = Date.now() - t0;

  // Phase 1 — backward search from the literal goal statement.
  const tSearch = Date.now();
  let goalFact: SolverFact | null = null;
  try {
    goalFact = engine.prove(goal, 0);
  } catch (e) {
    if (e instanceof BudgetExceeded) {
      stats.budgetExhausted = true;
      goalFact = engine.findFactForStmt(goal) ?? null;
    } else {
      throw e;
    }
  }
  stats.searchMs = Date.now() - tSearch;

  const buildTree = (): SolutionTreeJson => {
    const cone = new Set<string>();
    if (goalFact) {
      const stack = [goalFact.id];
      while (stack.length) {
        const id = stack.pop()!;
        if (cone.has(id)) continue;
        cone.add(id);
        const fact = engine.getFact(id);
        fact?.derivations.forEach((d) => stack.push(...d.depFactIds));
      }
    }
    return {
      goalFactId: goalFact?.id,
      facts: engine.allFacts().map((f) => ({
        id: f.id,
        text: stmtToText(f.stmt),
        source: f.source,
        givenRef: f.givenRef,
        derivations: f.derivations.map((d) => ({
          reason: d.reason,
          deps: d.depFactIds,
          diagramRefs: d.diagramRefs,
        })),
        inGoalCone: cone.has(f.id),
      })),
    };
  };

  const seed = {
    givens,
    diagramPremises: proof.premises.diagramStatements.length,
    existingStepsSeeded: existingSeeded,
    droppedInvalidSteps,
  };

  if (!goalFact) {
    return {
      ok: false,
      error: stats.budgetExhausted
        ? "budget exhausted before reaching the goal"
        : "no derivation of the goal found",
      goalText: stmtToText(goal),
      solutions: [],
      tree: buildTree(),
      stats: { ...stats, totalMs: Date.now() - t0 },
      seed,
    };
  }

  // Phase 2 — extract distinct candidate proofs.
  const tExtract = Date.now();
  const assignments = enumerateAssignments(
    engine,
    goalFact.id,
    options.maxExtractionCombos,
  );
  const seenKeys = new Set<string>();
  const extracted: ExtractedProof[] = [];
  for (const assignment of assignments) {
    const candidate = extractProof(engine, goalFact, assignment, goal);
    if (!candidate || seenKeys.has(candidate.key)) continue;
    seenKeys.add(candidate.key);
    extracted.push(candidate);
  }
  // The checker flags premises that never contribute as unused steps, so
  // candidates citing every given go first; among those, fewest steps wins.
  extracted.sort(
    (a, b) => b.usedGivens - a.usedGivens || a.steps.length - b.steps.length,
  );
  stats.solutionsExtracted = extracted.length;
  stats.extractMs = Date.now() - tExtract;

  // Phase 3 — verification gate: full checker per candidate.
  const tVerify = Date.now();
  const premisesText = premisesSection(proofText);
  const solutions: Solution[] = [];
  const rejected: Solution[] = [];
  const verifiedDisplayKeys = new Set<string>();
  for (const candidate of extracted) {
    if (solutions.length >= options.maxSolutions) break;
    // Correspondence variants of an already-verified proof are not new
    // solutions from the user's perspective.
    if (verifiedDisplayKeys.has(candidate.displayKey)) continue;
    const text = buildProofText(premisesText, candidate.steps);
    const gate = runProofCheckerFromText(text);
    stats.fullCheckerRuns++;
    const issues =
      gate.errors.length > 0
        ? gate.errors.map((e) => e.code)
        : collectProofCheckerIssues(gate);
    if (issues.length === 0) {
      verifiedDisplayKeys.add(candidate.displayKey);
      solutions.push({
        steps: candidate.steps,
        proofText: text,
        verified: true,
        issues: [],
      });
    } else if (rejected.length < 3) {
      rejected.push({
        steps: candidate.steps,
        proofText: text,
        verified: false,
        issues,
      });
    }
  }
  stats.solutionsVerified = solutions.length;
  // Nothing survived: return the first rejected candidates with their gate
  // issues so callers (CLI, harness panel) can show why.
  if (solutions.length === 0) solutions.push(...rejected);
  stats.verifyMs = Date.now() - tVerify;

  const verifiedCount = solutions.filter((s) => s.verified).length;
  return {
    ok: verifiedCount > 0,
    error: verifiedCount === 0 ? "no candidate survived verification" : undefined,
    goalText: stmtToText(goal),
    solutions,
    tree: buildTree(),
    stats: { ...stats, totalMs: Date.now() - t0 },
    seed,
  };
};

export type { SolverOptions, SolverResult } from "./solverTypes";
