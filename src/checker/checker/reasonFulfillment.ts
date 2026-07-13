import { ParseObj, ProofContent } from "../../geometry-object";
import {
  ProofGraph,
  ProofStep,
  ReasonDefinition,
  StatementGroup,
  Stmt,
  WaysToProveCandidate,
  WaysToProveSlot,
  WaysToProveSummary,
} from "../types/checkerTypes";
import { FactIndex } from "./fillDeps/factIndex";
import { fillDeps } from "./fillDeps/fillDeps";
import { stmtKey } from "./reasonChecks/utils";
import { ReasonTemplate } from "./reasonTemplates";

export interface ReasonApplicabilityIndex {
  statementRefsByFunction: Map<string, string[]>;
  diagramRefsByFunction: Map<string, string[]>;
}

const getStepStatement = (
  proofGraph: ProofGraph,
  ref: string,
): Stmt | undefined => {
  const diagramStmt = proofGraph.diagramPremises.get(ref);
  if (diagramStmt) return diagramStmt.statement;
  return proofGraph.nodes.get(ref)?.statement;
};

// Collects raw object labels from a statement's arguments (e.g. AB, BAC, ADC).
const collectRefObjects = (stmt?: Stmt): string[] => {
  if (!stmt?.arguments?.length) return [];
  return stmt.arguments.map((arg: ParseObj) => arg.v);
};

// Creates a readable contributor label from a statement.
const formatStmtLabel = (stmt?: Stmt): string | undefined => {
  if (!stmt) return undefined;
  const args = stmt.arguments.map((arg) => arg.v).join(", ");
  return `${stmt.function}(${args})`;
};

/** Dedupes duplicate statements (same `stmtKey`), e.g. premise `g_1` vs step `1`. */
const uniqueContributorLabelsFromRefs = (
  proofGraph: ProofGraph,
  refs: readonly string[],
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ref of refs) {
    const stmt = getStepStatement(proofGraph, ref);
    if (!stmt) continue;
    const k = stmtKey(stmt);
    if (seen.has(k)) continue;
    seen.add(k);
    const label = formatStmtLabel(stmt);
    if (label) out.push(label);
  }
  return out;
};

/**
 * Computes ways-to-prove for one step via the `fillDeps` kernel: the expected
 * dependency statements are derived from the step's conclusion and looked up
 * among the already-indexed prior steps, and each complete assignment is
 * confirmed with a single reason check — replacing the old
 * enumerate-every-combo sweep.
 */
export const computeWaysToProve = ({
  currStep,
  proofGraph,
  reasonDefs,
  groups,
  template,
  index,
  ctx,
}: {
  currStep: ProofStep;
  proofGraph: ProofGraph;
  reasonDefs: Map<string, ReasonDefinition>;
  groups: Map<string, StatementGroup>;
  template?: ReasonTemplate;
  index: ReasonApplicabilityIndex;
  ctx: ProofContent;
}): WaysToProveSummary | undefined => {
  const reason = currStep.reason;
  const statement = currStep.statement;
  if (!reason || !statement) return undefined;
  if (reason.function === "given") return undefined;
  const definition = reasonDefs.get(reason.function);
  if (!definition || !template) return undefined;

  // Index only the statements the caller's applicability index vouches for
  // (i.e. valid steps proven before the current one).
  const facts = new FactIndex(ctx);
  index.statementRefsByFunction.forEach((refs) => {
    for (const ref of refs) {
      const stmt = getStepStatement(proofGraph, ref);
      if (stmt) facts.add(ref, stmt);
    }
  });

  const dependencySlots = template.slots.filter(
    (slot) => slot.source === "dependency",
  );
  const diagramSlots = template.slots.filter(
    (slot) => slot.source === "diagram",
  );

  const result = fillDeps({
    reason: reason.function,
    statement,
    facts,
    ctx,
    graph: proofGraph,
    reasonDefs,
    groups,
  });

  const slotFor = (
    slot: ReasonTemplate["slots"][number],
    ref: string | undefined,
  ): WaysToProveSlot => {
    const depStmt = ref ? getStepStatement(proofGraph, ref) : undefined;
    return {
      slotId: slot.id,
      expected: slot.expectedType,
      state: ref ? "matched" : "missing",
      sourceRef: ref,
      visualRef: depStmt?.arguments[0]?.v,
      visualRefs: collectRefObjects(depStmt),
    };
  };

  const validCandidates: WaysToProveCandidate[] = result.complete.map(
    (fill) => {
      const depSlotStates = dependencySlots.map((slot, i) =>
        slotFor(slot, fill.refs[i]),
      );
      const diagramSlotStates = diagramSlots.map((slot, i) =>
        slotFor(slot, fill.diagramRefs[i]),
      );
      const allRefs = [...fill.refs, ...fill.diagramRefs];
      return {
        reasonFunction: reason.function,
        templateId: template.id,
        completion: 1,
        slots: [...depSlotStates, ...diagramSlotStates],
        dependencyRefs: fill.refs,
        diagramRefs: fill.diagramRefs,
        statementRefs: allRefs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
        contributors: uniqueContributorLabelsFromRefs(proofGraph, allRefs),
      };
    },
  );

  const partialCandidates: WaysToProveCandidate[] = result.partial.map(
    (partial) => {
      const depSlotStates = dependencySlots.map((slot, i) =>
        slotFor(slot, partial.filled[i]?.ref),
      );
      const refs = partial.filled
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .map((f) => f.ref);
      const matched = depSlotStates.filter((s) => s.state === "matched").length;
      return {
        reasonFunction: reason.function,
        templateId: template.id,
        completion:
          dependencySlots.length === 0 ? 1 : matched / dependencySlots.length,
        slots: depSlotStates,
        dependencyRefs: refs,
        diagramRefs: [],
        statementRefs: refs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
        contributors: uniqueContributorLabelsFromRefs(proofGraph, refs),
      };
    },
  );

  const candidates = (
    validCandidates.length > 0 ? validCandidates : partialCandidates
  ).sort((a, b) => b.completion - a.completion);
  const top = candidates[0];
  const matchedTop = top
    ? top.slots.filter((slot) => slot.state === "matched").length
    : 0;
  return {
    reasonFunction: reason.function,
    totalSlots: template.slots.length,
    matchedSlots: matchedTop,
    candidates,
  };
};

// Adds a reference to a function-index map.
const upsertRef = (
  map: Map<string, string[]>,
  statementFn: string,
  ref: string,
): void => {
  const refs = map.get(statementFn);
  if (refs) {
    refs.push(ref);
    return;
  }
  map.set(statementFn, [ref]);
};

// Creates the initial lookup index used by ways-to-prove enumeration.
export const createReasonApplicabilityIndex = (
  proofGraph: ProofGraph,
): ReasonApplicabilityIndex => {
  const diagramRefsByFunction = new Map<string, string[]>();
  Array.from(proofGraph.diagramPremises.entries()).forEach(([ref, dStmt]) => {
    upsertRef(diagramRefsByFunction, dStmt.statement.function, ref);
  });
  return {
    statementRefsByFunction: new Map<string, string[]>(),
    diagramRefsByFunction,
  };
};

// Incrementally indexes proven statements as graph traversal advances.
export const indexProofStepForReasons = ({
  step,
  stepNum,
  isCorrect,
  index,
}: {
  step: ProofStep;
  stepNum: string;
  isCorrect: boolean;
  index: ReasonApplicabilityIndex;
}): void => {
  if (!isCorrect || !step.statement) return;
  // Omit premise labels like `g_1`; they duplicate numbered proof rows for the same
  // facts and let enumeration produce illegal combos (e.g. g_1 + 1 both con_seg AB,AD).
  if (!/^\d+$/.test(stepNum)) return;
  upsertRef(index.statementRefsByFunction, step.statement.function, stepNum);
};
