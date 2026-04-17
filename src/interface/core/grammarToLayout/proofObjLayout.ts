import { ProofObj, ProofStep, Stmt } from "checker/types/checkerTypes";
import React from "react";
import { reasonFromFunction, Reasons } from "../../theorems/reasons";
import { makeStepMeta } from "../../theorems/utils";
import { AspectRatio } from "../diagramSvg/svgTypes";
import { Transversal } from "../reasons/Transversal";
import { VerticalAngles } from "../reasons/VerticalAngles";
import { SVGModes } from "../types/diagramTypes";
import { LayoutProps } from "../types/layoutTypes";
import { StepMeta } from "../types/stepTypes";
import { seedBaseContentFromPremises } from "./proofObjBaseContent";
import {
  applyPremisesObjects,
  buildCongruenceTickTracker,
  createStmtObjectApplier,
} from "./proofObjObjectApplication";
import { stmtListToText, stmtToText } from "./proofObjText";

const normalizeStepNumber = (step: ProofStep, fallback: number): number => {
  const raw = step.stepNumber ?? "";
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const interactiveLayoutFromProofObj = (proof: ProofObj): LayoutProps => {
  const givenSteps = proof.steps.filter((s) => s.type === "given");
  const proofSteps = proof.steps.filter((s) => s.type === "proof");
  const proveStmt =
    proof.goal ?? proof.steps.find((s) => s.type === "goal")?.statement;
  const isConRightStmt = (stmt?: Stmt): boolean =>
    stmt?.function === "con_right";

  // const isVertAngReason = (reasonFunction?: string): boolean =>
  //   (reasonFunction ?? "").toLowerCase() === "vert_ang";

  const tickTracker = buildCongruenceTickTracker([
    ...givenSteps.map((s) => s.statement),
    ...proofSteps.map((s) =>
      s.statement?.function === "con_ang" && isConRightStmt(s.statement)
        ? undefined
        : s.statement,
    ),
    proveStmt,
  ]);
  const applyStmtObjects = createStmtObjectApplier(tickTracker);

  const premisesSummary = (isActive: boolean) => {
    const entries: Array<(active: boolean) => JSX.Element> = [];
    if (givenSteps.length > 0) {
      entries.push(stmtListToText(givenSteps.map((s) => s.statement)));
    }
    if (entries.length === 0) return React.createElement("span", null, "");
    return React.createElement(
      "span",
      null,
      ...entries.flatMap((entry, i) => {
        if (i === 0) return [entry(isActive)];
        return [", ", entry(isActive)];
      }),
    );
  };

  const givensMeta = makeStepMeta({
    reason: Reasons.Given,
    text: premisesSummary,
    additions: ({ ctx, frame, mode }) => {
      applyPremisesObjects(ctx, frame, mode);
      givenSteps.forEach((s) =>
        applyStmtObjects(ctx, frame, mode, s.statement),
      );
    },
  });

  const provesMeta = makeStepMeta({
    reason: Reasons.Empty,
    prevStep: givensMeta,
    text: stmtToText(proveStmt),
    additions: ({ ctx, frame }) =>
      applyStmtObjects(ctx, frame, SVGModes.Derived, proveStmt),
  });

  const stepLabelToUiIndex = new Map<number, number>();
  proofSteps.forEach((step, idx) => {
    const uiIndex = idx + 1;
    const stepLabelNumber = normalizeStepNumber(step, uiIndex);
    stepLabelToUiIndex.set(stepLabelNumber, uiIndex);
  });

  const stepMetas: StepMeta[] = [];
  proofSteps.forEach((step, idx) => {
    const currStep = idx + 1;
    const dependencyErrorIndices = new Set(
      step.errors
        .filter(
          (e) =>
            e.type === "reason_dep_missing" ||
            e.type === "reason_dep_type_mismatch",
        )
        .map((e) => e.data?.index)
        .filter((index): index is number => typeof index === "number"),
    );
    const dependsOn =
      step.reason?.arguments
        ?.map((arg, argIdx) => {
          if (dependencyErrorIndices.has(argIdx)) return "?";

          if (!/^\d+$/.test(arg)) return undefined;
          const stepLabelNumber = parseInt(arg, 10);
          const uiIndex = stepLabelToUiIndex.get(stepLabelNumber);
          // Future-step dependencies imply a cycle/invalid reference for this row:
          // render as a missing dependency marker on the current step instead.
          if (uiIndex !== undefined && uiIndex > currStep) return "?";
          return uiIndex !== undefined ? String(uiIndex) : undefined;
        })
        .filter((dep): dep is string => dep !== undefined) ?? [];

    const dependencyStatements = dependsOn
      .map((n) => proofSteps[Number(n) - 1])
      .filter((depStep): depStep is ProofStep => Boolean(depStep?.statement))
      .map((depStep) => ({
        stmt: depStep.statement as Stmt,
        isRightAngleEquality: isConRightStmt(depStep.statement),
      }));

    const isGivenReason =
      (step.reason?.function ?? "").toLowerCase() === "given";
    const isRightAngleEqualityStep = isConRightStmt(step.statement);
    // Diagram premises for reasons with `diagramDependencies` are attached only
    // after `checkReasonApplication` in `runProofChecker`.
    const intersectSegDep = step.diagramDeps?.find(
      (d) => d.statement.function === "intersect_seg",
    );
    const transversalDeps =
      step.diagramDeps?.filter((d) => d.statement.function === "transversal") ??
      [];
    // const hasVertAngDiagramHighlight =
    //   isVertAngReason(step.reason?.function) &&
    //   intersectSegDep?.statement.arguments?.length === 3;

    const prevStep = idx === 0 ? givensMeta : stepMetas[idx - 1];
    const stepMeta = makeStepMeta({
      reason: reasonFromFunction(step.reason?.function),
      waysToProve: step.waysToProve,
      prevStep,
      dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
      text: stmtToText(step.statement),
      additions: ({ ctx, frame, mode }) => {
        applyStmtObjects(ctx, frame, mode, step.statement, {
          isRightAngleEquality: isRightAngleEqualityStep,
        });
      },
      highlight:
        !isGivenReason &&
        (dependencyStatements.length > 0 || Boolean(step.diagramDeps?.length))
          ? ({ ctx, frame }) => {
              dependencyStatements.forEach((dep) =>
                applyStmtObjects(ctx, frame, SVGModes.ReliesOn, dep.stmt, {
                  isRightAngleEquality: dep.isRightAngleEquality,
                }),
              );

              if (intersectSegDep) {
                const [s1, s2, p] = intersectSegDep.statement.arguments.map(
                  (a) => a.v,
                );
                VerticalAngles.highlight({ ctx, frame }, s1, s2, p);
              }
              for (const dep of transversalDeps) {
                Transversal.highlight({ ctx, frame }, dep.statement);
              }
            }
          : undefined,
    });
    stepMetas.push(stepMeta);
  });

  return {
    name: proof.title ?? "Imported proof",
    title: proof.title ?? "Imported proof",
    baseContent: () => seedBaseContentFromPremises(proof),
    givens: givensMeta,
    proves: provesMeta,
    steps: stepMetas,
    diagramAspect: AspectRatio.Square,
  };
};
