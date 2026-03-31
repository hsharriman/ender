import { ProofObj, ProofStep, Stmt } from "checker/types/checkerTypes";
import React from "react";
import { reasonFromFunction, Reasons } from "../../theorems/reasons";
import { GIVEN_ID, makeStepMeta, PROVE_ID } from "../../theorems/utils";
import { DiagramContent } from "../builder/DiagramContent";
import { AspectRatio } from "../diagramSvg/svgTypes";
import { CongruentTriangles } from "../reasons/CongruentTriangles";
import { EqualAngles } from "../reasons/EqualAngles";
import { EqualSegments } from "../reasons/EqualSegments";
import { EqualTriangles } from "../reasons/EqualTriangles";
import { ShowPoint, SVGModes } from "../types/diagramTypes";
import { LayoutProps, ProofMeta, Reason } from "../types/layoutTypes";
import {
  ProofTextItem,
  StaticProofTextItem,
  StepMeta,
} from "../types/stepTypes";

export const staticLayout = (proofMeta: LayoutProps): ProofMeta => {
  // reset stored variables
  const ctx = proofMeta.baseContent();
  const reasons: Reason[] = [];
  const texts: StaticProofTextItem[] = [];

  ctx.addFrame(GIVEN_ID);
  proofMeta.givens.diagram(ctx, GIVEN_ID);
  proofMeta.steps.forEach((step, i) => {
    texts.push({
      stmt: step.staticText(),
      reason: step.reason.title,
    });
    if (step.reason.body !== "" && step.reason.title !== Reasons.Given.title) {
      reasons.push(step.reason);
    }
    const s = ctx.addFrame(`s${i + 1}`);
    step.diagram(ctx, s);
  });
  return {
    layout: "static",
    props: {
      ctx: ctx.getCtx(),
      texts: texts,
      reasons: reasons,
      givenText: proofMeta.givens.staticText(),
      provesText: proofMeta.proves.staticText(),
      name: proofMeta.name,
      diagramAspect: proofMeta.diagramAspect,
    },
  };
};
export const interactiveLayout = (proofMeta: LayoutProps): ProofMeta => {
  const ctx = proofMeta.baseContent();
  const highlightCtx = proofMeta.baseContent();
  const additionCtx = proofMeta.baseContent();

  const linkedTexts: ProofTextItem[] = [];
  const reasonMap = new Map<string, Reason>();

  // GIVEN
  ctx.addFrame(GIVEN_ID);
  proofMeta.givens.diagram(ctx, GIVEN_ID);

  // PROVE
  ctx.addFrame(PROVE_ID);
  proofMeta.proves.diagram(ctx, PROVE_ID);

  // add given and prove to linkedTexts
  linkedTexts.push({
    k: GIVEN_ID,
    v: proofMeta.givens.text,
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: proofMeta.proves.text,
    alwaysActive: true,
  });

  let prevStep = proofMeta.givens;
  proofMeta.steps.forEach((step, i) => {
    let textMeta = {};
    const s = ctx.addFrame(`s${i + 1}`);
    additionCtx.addFrame(`s${i + 1}`);
    step.unfocused({ ctx, frame: s });

    step.additions({ ctx: additionCtx, frame: s, mode: SVGModes.Derived });

    if (step.dependsOn) {
      const depIds = step.dependsOn.map((i) => `s${i}`);
      ctx.reliesOn(s, depIds);
      textMeta = { dependsOn: new Set(depIds) };
    }
    // setup highlighting for interactive diagrams
    if (step.highlight) {
      highlightCtx.addFrame(`s${i + 1}`);
      step.highlight({ ctx: highlightCtx, frame: s });
    }

    reasonMap.set(s, step.reason);
    linkedTexts.push({
      ...textMeta,
      k: s,
      v: step.text,
      reason: step.reason.title,
    });
    step = { ...step, prevStep: prevStep };
    prevStep = step;
  });
  return {
    layout: "interactive",
    props: {
      ctx: ctx.getCtx(),
      reasonMap: reasonMap,
      linkedTexts: linkedTexts,
      name: proofMeta.name,
      highlightCtx: highlightCtx.getCtx(),
      additionCtx: additionCtx.getCtx(),
      diagramAspect: proofMeta.diagramAspect,
    },
  };
};

const stmtToText = (stmt?: Stmt) => (isActive: boolean) => {
  if (!stmt) return React.createElement("span", null, "");
  const args = stmt.arguments.map((a) => a.v);
  if (stmt.function === "con_seg" && args.length === 2) {
    return EqualSegments.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "con_ang" && args.length === 2) {
    return EqualAngles.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "con_tri" && args.length === 2) {
    return EqualTriangles.text([args[0], args[1]])(isActive);
  }
  return React.createElement(
    "span",
    null,
    `${stmt.function}(${args.join(", ")})`,
  );
};

const stmtListToText =
  (stmts: Array<Stmt | undefined>) => (isActive: boolean) =>
    React.createElement(
      "span",
      null,
      ...stmts.flatMap((stmt, i) => {
        const parts: React.ReactNode[] = [];
        if (i > 0) parts.push("; ");
        parts.push(
          React.createElement(
            React.Fragment,
            { key: `stmt-${i}` },
            stmtToText(stmt)(isActive),
          ),
        );
        return parts;
      }),
    );

const normalizeStepNumber = (step: ProofStep, fallback: number): number => {
  const raw = step.stepNumber?.replace(/\[|\]/g, "") ?? "";
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const seedBaseContentFromPremises = (proof: ProofObj): DiagramContent => {
  const ctx = new DiagramContent();
  proof.premises.points.forEach((pt) => {
    ctx.addPoint(
      {
        label: pt.v,
        pt: pt.pt,
      },
      pt.offset,
      ShowPoint.Hide,
    );
  });

  proof.premises.segments.forEach((seg) => {
    if (seg.v.length !== 2) return;
    const p1 = ctx.getPoint(seg.v[0]);
    const p2 = ctx.getPoint(seg.v[1]);
    if (p1 && p2) {
      ctx.addSegment({ p1: p1.obj, p2: p2.obj });
    }
  });

  proof.premises.triangles.forEach((tri) => {
    if (tri.v.length !== 3) return;
    const p1 = ctx.getPoint(tri.v[0]);
    const p2 = ctx.getPoint(tri.v[1]);
    const p3 = ctx.getPoint(tri.v[2]);
    if (p1 && p2 && p3) {
      ctx.addTriangle({
        pts: [p1.obj, p2.obj, p3.obj],
      });
    }
  });

  proof.premises.quadrilaterals.forEach((quad) => {
    if (quad.v.length !== 4) return;
    const p1 = ctx.getPoint(quad.v[0]);
    const p2 = ctx.getPoint(quad.v[1]);
    const p3 = ctx.getPoint(quad.v[2]);
    const p4 = ctx.getPoint(quad.v[3]);
    if (p1 && p2 && p3 && p4) {
      ctx.addQuadrilateral({
        pts: [p1.obj, p2.obj, p3.obj, p4.obj],
      });
    }
  });

  proof.premises.angles.forEach((ang) => {
    if (ang.v.length !== 3) return;
    const start = ctx.getPoint(ang.v[0]);
    const center = ctx.getPoint(ang.v[1]);
    const end = ctx.getPoint(ang.v[2]);
    if (start && center && end) {
      ctx.addAngle({
        start: start.obj,
        center: center.obj,
        end: end.obj,
      });
    }
  });
  return ctx;
};

export const interactiveLayoutFromProofObj = (proof: ProofObj): LayoutProps => {
  const applyStmtObjects = (
    ctx: DiagramContent,
    frame: string,
    mode: SVGModes,
    stmt?: Stmt,
  ) => {
    if (!stmt) return;
    if (stmt.function === "con_seg" && stmt.arguments.length === 2) {
      EqualSegments.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "con_ang" && stmt.arguments.length === 2) {
      EqualAngles.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "con_tri" && stmt.arguments.length === 2) {
      CongruentTriangles.congruentLabel(
        { ctx, frame },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        mode,
      );
      return;
    }
    // stmt.arguments.forEach((arg) => {
    //   if (arg.type === Obj.Segment) {
    //     const s = ctx.getSegment(arg.v);
    //     if (s) s.mode(frame, mode);
    //   } else if (arg.type === Obj.Angle) {
    //     const a = ctx.getAngle(arg.v);
    //     if (a) a.mode(frame, mode);
    //   } else if (arg.type === Obj.Triangle) {
    //     const t = ctx.getTriangle(arg.v);
    //     if (t) t.mode(frame, mode);
    //   } else if (arg.type === Obj.Quadrilateral) {
    //     const q = ctx.getQuadrilateral(arg.v);
    //     if (q) q.mode(frame, mode);
    //   } else if (arg.type === Obj.Point) {
    //     const p = ctx.getPoint(arg.v);
    //     if (p) p.mode(frame, mode);
    //   }
    // });
  };

  const applyPremisesObjects = (
    ctx: DiagramContent,
    frame: string,
    mode: SVGModes,
  ) => {
    const base = ctx.getCtx();
    base.segments.forEach((s) => s.mode(frame, mode));
    base.angles.forEach((a) => a.mode(frame, mode));
    base.triangles.forEach((t) => t.mode(frame, mode));
    base.rectangles.forEach((q) => q.mode(frame, mode));
    base.points.forEach((p) => p.mode(frame, mode));
  };

  const premisesSummary = (isActive: boolean) => {
    const entries: Array<(active: boolean) => JSX.Element> = [];
    const givenSteps = proof.steps.filter((s) => s.type === "given");
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

  const proveStmt =
    proof.goal ?? proof.steps.find((s) => s.type === "goal")?.statement;

  const givensMeta = makeStepMeta({
    reason: Reasons.Given,
    text: premisesSummary,
    additions: ({ ctx, frame, mode }) => {
      applyPremisesObjects(ctx, frame, mode);
      const givenSteps = proof.steps.filter((s) => s.type === "given");
      givenSteps.forEach((s) =>
        applyStmtObjects(ctx, frame, mode, s.statement),
      );
    },
  });

  const provesMeta = makeStepMeta({
    reason: Reasons.Empty,
    prevStep: givensMeta,
    text: stmtToText(proveStmt),
    additions: ({ ctx, frame, mode }) =>
      applyStmtObjects(ctx, frame, SVGModes.Derived, proveStmt),
  });

  const proofSteps = proof.steps.filter((s) => s.type === "proof");
  const stepLabelToUiIndex = new Map<number, number>();
  proofSteps.forEach((step, idx) => {
    const uiIndex = idx + 1;
    const stepLabelNumber = normalizeStepNumber(step, uiIndex);
    stepLabelToUiIndex.set(stepLabelNumber, uiIndex);
  });

  const stepMetas: StepMeta[] = [];
  proofSteps.forEach((step, idx) => {
    const dependsOn =
      step.reason?.arguments
        ?.map((arg) => (/^\d+$/.test(arg) ? parseInt(arg, 10) : null))
        .filter((n): n is number => n !== null)
        .map((stepLabelNumber) => stepLabelToUiIndex.get(stepLabelNumber))
        .filter((n): n is number => n !== undefined)
        .map((n) => String(n)) ?? [];

    const prevStep = idx === 0 ? givensMeta : stepMetas[idx - 1];
    const stepMeta = makeStepMeta({
      reason: reasonFromFunction(step.reason?.function),
      prevStep,
      dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
      text: stmtToText(step.statement),
      additions: ({ ctx, frame, mode }) =>
        applyStmtObjects(ctx, frame, mode, step.statement),
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
