import { ParseObj, ProofContent } from "../../geometry-object";
import {
  ProofGraph,
  ProofStep,
  ReasonDefinition,
  StatementGroup,
  Stmt,
  WaysToProveCandidate,
  WaysToProveSummary,
} from "../types/checkerTypes";
import { checkReasonApplication } from "./reasonApplication";
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

// Creates a readable contributor label from a statement.
const formatStmtLabel = (stmt?: Stmt): string | undefined => {
  if (!stmt) return undefined;
  const args = stmt.arguments.map((arg) => arg.v).join(", ");
  return `${stmt.function}(${args})`;
};

// Returns all currently available refs that can satisfy a slot.
const getRefsForSlot = (
  expectedType: string,
  source: "dependency" | "diagram",
  index: ReasonApplicabilityIndex,
  groups: Map<string, StatementGroup>,
): string[] => {
  const types = pickExpectedTypes(expectedType, groups);
  const sourceMap =
    source === "diagram"
      ? index.diagramRefsByFunction
      : index.statementRefsByFunction;
  return types.flatMap((typeName) => sourceMap.get(typeName) ?? []);
};

// Enumerates candidate ref combinations for dependency slots. If a slot has no
// refs, we include `undefined` so partial ways-to-prove can still be surfaced.
const enumerateDependencyRefCombos = (
  dependencySlots: ReasonTemplate["slots"],
  index: ReasonApplicabilityIndex,
  groups: Map<string, StatementGroup>,
  cap: number,
): Array<Array<string | undefined>> => {
  let combos: Array<Array<string | undefined>> = [[]];
  for (const slot of dependencySlots) {
    const refs = getRefsForSlot(slot.expectedType, slot.source, index, groups);
    const slotRefs: Array<string | undefined> =
      refs.length > 0 ? refs : [undefined];
    const nextCombos: Array<Array<string | undefined>> = [];
    combos.forEach((partial) => {
      slotRefs.forEach((ref) => {
        if (nextCombos.length >= cap) return;
        nextCombos.push([...partial, ref]);
      });
    });
    combos = nextCombos;
    if (combos.length >= cap) break;
  }
  return combos;
};

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

    const baseContributors = concreteDepRefs
      .map((ref) => formatStmtLabel(getStepStatement(proofGraph, ref)))
      .filter((label): label is string => Boolean(label));

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
    // Failed reason check => keep as partial candidate.
    if (!isCorrect) {
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
    const contributors = [
      ...concreteDepRefs.map((ref) =>
        formatStmtLabel(getStepStatement(proofGraph, ref)),
      ),
      ...diagramRefs.map((ref) =>
        formatStmtLabel(getStepStatement(proofGraph, ref)),
      ),
    ].filter((label): label is string => Boolean(label));
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
  // Dedupes equivalent candidates based on contributor and slot signatures so
  // different reference paths that imply the same way collapse into one.
  const dedupeByRefs = (candidatesToDedupe: WaysToProveCandidate[]) => {
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
  // Prefer fully valid candidates; otherwise surface the best partial options.
  const candidates = dedupeByRefs(
    validCandidates.length > 0 ? validCandidates : partialCandidates,
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
  upsertRef(index.statementRefsByFunction, step.statement.function, stepNum);
};
