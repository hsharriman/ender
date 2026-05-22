import { ParseObj, ProofContent } from "../../geometry-object";
import {
  ProofGraph,
  ProofObj,
  ProofStep,
  ReasonDefinition,
  StatementGroup,
  Stmt,
  WaysToProveCandidate,
  WaysToProveSummary,
} from "../types/checkerTypes";
import { checkReasonApplication } from "./reasonApplication";
import { stmtKey } from "./reasonChecks/utils";
import { ReasonTemplate } from "./reasonTemplates";

export interface ReasonApplicabilityIndex {
  statementRefsByFunction: Map<string, string[]>;
  diagramRefsByFunction: Map<string, string[]>;
}

// TODO file is heavily vibe coded, needs to be checked and cleaned.

// Expands an expected dependency type into all acceptable concrete statement
// function names (including group extensions).
const pickExpectedTypes = (
  expectedType: string,
  groups: Map<string, StatementGroup>,
): string[] => {
  const group = groups.get(expectedType);
  if (!group) return [expectedType];
  return [group.base, ...group.extensions];
};

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

/** Sort step refs numerically when they are integers (e.g. "01"), else lexically. */
const sortRefMultiset = (refs: string[]): string[] =>
  [...refs].sort((a, b) => {
    const na = /^\d+$/.test(a) ? parseInt(a, 10) : Number.NaN;
    const nb = /^\d+$/.test(b) ? parseInt(b, 10) : Number.NaN;
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

/**
 * Stable key for validated ways-to-prove: multiset of citation refs (unordered).
 * Different permutations of the same multiset compare equal.
 */
const canonicalValidCandidateMultisetKey = (
  candidate: WaysToProveCandidate,
): string =>
  [
    candidate.reasonFunction,
    sortRefMultiset(candidate.dependencyRefs).join(","),
    sortRefMultiset(candidate.diagramRefs).join(","),
  ].join("|");

/**
 * Collapse candidates that cite the same multiset of proof-step / diagram refs
 * (under the same reason), regardless of dependency-slot **order**.
 * Safe only when every dependency slot expects the **same** type (e.g. SSS /
 * three `con_seg`): order is then immaterial up to multiset. For asymmetric
 * reasons (e.g. SAS: segment / angle / segment), applying this would wrongly
 * merge distinct slot assignments such as `(1,3,2)` vs `(2,3,1)`.
 */
const dedupeCandidatesByCitationMultiset = (
  candidates: WaysToProveCandidate[],
): WaysToProveCandidate[] => {
  const byKey = new Map<string, WaysToProveCandidate>();
  for (const c of candidates) {
    const key = canonicalValidCandidateMultisetKey(c);
    if (!byKey.has(key)) byKey.set(key, c);
  }
  return [...byKey.values()];
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

// Returns all currently available refs that can satisfy a slot.
const getRefsForSlot = (
  expectedType: string,
  source: "dependency" | "diagram",
  index: ReasonApplicabilityIndex,
  groups: Map<string, StatementGroup>,
  proof?: ProofObj,
): string[] => {
  const types = pickExpectedTypes(expectedType, groups);
  const sourceMap =
    source === "diagram"
      ? index.diagramRefsByFunction
      : index.statementRefsByFunction;
  return types.flatMap((typeName) => sourceMap.get(typeName) ?? []);
};

// Enumerates candidate ref combinations for dependency slots.
// Each slot consumes at most one citation; the same proof step cannot fill two holes.
//
// Choices for a hole are:
// - `[undefined]` if no statements match that hole, or every matching ref is already
//   used in an earlier dependency slot (`unusedRefs.length === 0`).
// - Otherwise every **still-available** citation for this hole **plus `undefined`**.
// The explicit `undefined` branch is essential for partial ways-to-prove: e.g. SAS
// can surface `(seg₁, ∅, seg₂)` and `(seg₁, ang, ∅)` from the same walk without
// hard-coding asymmetry (bookends vs SSS gaps).
const enumerateDependencyRefCombos = (
  dependencySlots: ReasonTemplate["slots"],
  index: ReasonApplicabilityIndex,
  groups: Map<string, StatementGroup>,
  cap: number,
): Array<Array<string | undefined>> => {
  let combos: Array<Array<string | undefined>> = [[]];
  for (const slot of dependencySlots) {
    const refs = getRefsForSlot(slot.expectedType, slot.source, index, groups);
    const nextCombos: Array<Array<string | undefined>> = [];
    combos.forEach((partial) => {
      const used = new Set(
        partial.filter(
          (r): r is string => typeof r === "string" && r.length > 0,
        ),
      );
      const unusedRefs = refs.filter((ref) => !used.has(ref));
      const choices: Array<string | undefined> =
        refs.length === 0 || unusedRefs.length === 0
          ? [undefined]
          : [...unusedRefs, undefined];
      choices.forEach((ref) => {
        if (nextCombos.length >= cap) return;
        nextCombos.push([...partial, ref]);
      });
    });
    combos = nextCombos;
    if (combos.length >= cap) break;
  }
  return combos;
};

const homogeneousDependencySlots = (
  dependencySlots: ReasonTemplate["slots"],
): boolean =>
  dependencySlots.length <= 1 ||
  dependencySlots.every(
    (slot) => slot.expectedType === dependencySlots[0]?.expectedType,
  );

// Computes ways-to-prove for one step by enumerating candidate dependency combos,
// validating full combos through reason checks, and falling back to partial combos
// when no fully valid ways exist.
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
  if (!reason) return undefined;
  if (reason.function === "given") return undefined;
  const definition = reasonDefs.get(reason.function);
  if (!definition || !template) return undefined;

  // Only dependency slots are enumerated directly; diagram slots are populated by
  // reason-check side effects (`trialStep.diagramDeps`) for valid candidates.
  const dependencySlots = template.slots.filter(
    (slot) => slot.source === "dependency",
  );
  const dependencyCombos = enumerateDependencyRefCombos(
    dependencySlots,
    index,
    groups,
    4000,
  );
  const validCandidates: WaysToProveCandidate[] = [];
  const partialCandidates: WaysToProveCandidate[] = [];
  dependencyCombos.forEach((depRefs) => {
    // Build slot states from the enumerated refs for completion scoring and UI.
    const dependencyRefSlots = dependencySlots.map((slot, idx) => {
      const ref = depRefs[idx];
      if (!ref) {
        return {
          slotId: slot.id,
          expected: slot.expectedType,
          state: "missing" as const,
          sourceRef: undefined,
          visualRef: undefined,
          visualRefs: [],
        };
      }
      const depStmt = getStepStatement(proofGraph, ref);
      return {
        slotId: slot.id,
        expected: slot.expectedType,
        state: "matched" as const,
        sourceRef: ref,
        visualRef: depStmt?.arguments[0]?.v,
        visualRefs: collectRefObjects(depStmt),
      };
    });
    const allDependencyRefsPresent = dependencyRefSlots.every((slot) =>
      Boolean(slot.sourceRef),
    );
    const concreteDepRefs = depRefs.filter((ref): ref is string =>
      Boolean(ref),
    );
    const matchedDependencyCount = dependencyRefSlots.filter(
      (slot) => slot.state === "matched",
    ).length;
    const dependencyCompletion =
      dependencySlots.length === 0
        ? 1
        : matchedDependencyCount / dependencySlots.length;

    const baseContributors = uniqueContributorLabelsFromRefs(
      proofGraph,
      concreteDepRefs,
    );

    // Missing dependency refs => partial candidate only.
    if (!allDependencyRefsPresent) {
      partialCandidates.push({
        reasonFunction: reason.function,
        templateId: template.id,
        completion: dependencyCompletion,
        slots: dependencyRefSlots,
        contributors: baseContributors,
        dependencyRefs: concreteDepRefs,
        diagramRefs: [],
        statementRefs: concreteDepRefs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
      });
      return;
    }

    const trialStep: ProofStep = {
      ...currStep,
      reason: {
        function: reason.function,
        arguments: concreteDepRefs,
      },
      errors: [],
      diagramDeps: undefined,
    };
    const isCorrect = checkReasonApplication(
      trialStep,
      reasonDefs,
      proofGraph,
      ctx,
    );
    // Failed reason check => partial candidate with capped completion (all deps cited
    // does not imply the reason applies geometrically).
    if (!isCorrect) {
      const completionGeomFail =
        dependencySlots.length > 0
          ? (dependencySlots.length - 1) / Math.max(template.slots.length, 1)
          : dependencyCompletion;
      partialCandidates.push({
        reasonFunction: reason.function,
        templateId: template.id,
        completion: completionGeomFail,
        slots: dependencyRefSlots,
        contributors: baseContributors,
        dependencyRefs: concreteDepRefs,
        diagramRefs: [],
        statementRefs: concreteDepRefs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
      });
      return;
    }
    const diagramSlots = template.slots
      .filter((slot) => slot.source === "diagram")
      .map((slot, idx) => {
        const matchedDiagram = trialStep.diagramDeps?.[idx];
        return {
          slotId: slot.id,
          expected: slot.expectedType,
          state: matchedDiagram ? ("matched" as const) : ("missing" as const),
          sourceRef: matchedDiagram?.stepNumber,
          visualRef: matchedDiagram?.statement.arguments[0]?.v,
          visualRefs: collectRefObjects(matchedDiagram?.statement),
        };
      });
    const slots = [...dependencyRefSlots, ...diagramSlots];
    const diagramRefs =
      trialStep.diagramDeps?.map((diagramDep) => diagramDep.stepNumber) ?? [];
    const contributors = uniqueContributorLabelsFromRefs(proofGraph, [
      ...concreteDepRefs,
      ...diagramRefs,
    ]);
    validCandidates.push({
      reasonFunction: reason.function,
      templateId: template.id,
      completion: 1,
      slots,
      contributors,
      dependencyRefs: concreteDepRefs,
      diagramRefs,
      statementRefs: [
        ...concreteDepRefs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
        ...diagramRefs.flatMap((ref) =>
          collectRefObjects(getStepStatement(proofGraph, ref)),
        ),
      ],
    });
  });
  const primaryPool =
    validCandidates.length > 0 ? validCandidates : partialCandidates;
  let dedupedList = homogeneousDependencySlots(dependencySlots)
    ? dedupeCandidatesByCitationMultiset(primaryPool)
    : [...primaryPool];

  // Rare: same multiset + same slot-level visuals (distinct failure modes)—trim.
  const dedupeBySlotSignature = (
    candidatesToDedupe: WaysToProveCandidate[],
  ): WaysToProveCandidate[] => {
    const seen = new Set<string>();
    return candidatesToDedupe.filter((candidate) => {
      const contributorKey = candidate.contributors.slice().sort().join(" | ");
      const key = JSON.stringify({
        contributors: contributorKey,
        slots: candidate.slots.map((slot) => ({
          id: slot.slotId,
          state: slot.state,
          visualRef: slot.visualRef,
          visualRefs: (slot.visualRefs ?? []).slice().sort(),
        })),
      });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  dedupedList = dedupeBySlotSignature(dedupedList);

  const candidates = dedupedList.sort((a, b) => b.completion - a.completion);
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
