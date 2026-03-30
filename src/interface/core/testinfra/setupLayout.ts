import { Point } from "geometry-object";
import React from "react";
import { InteractiveAppPageProps } from "../../components/ender/InteractiveAppPage";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID, PROVE_ID } from "../../theorems/utils";
import { DiagramContent } from "../builder/DiagramContent";
import { AspectRatio } from "../diagramSvg/svgTypes";
import { ShowPoint, SVGModes } from "../types/diagramTypes";
import { LayoutProps, ProofMeta, Reason } from "../types/layoutTypes";
import { ProofTextItem, StaticProofTextItem } from "../types/stepTypes";

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

type ParseObjLike = {
  v: string;
};

type ParsePointObjLike = ParseObjLike & {
  pt: [number, number];
  offset: [number, number];
};

type StmtLike = {
  function: string;
  arguments: ParseObjLike[];
};

type ReasonLike = {
  function: string;
  arguments: string[];
};

type ProofStepLike = {
  type: "given" | "proof" | "goal";
  reason?: ReasonLike;
  statement?: StmtLike;
  stepNumber?: string;
};

export type ProofObjLike = {
  title: string | null;
  premises: {
    points: ParsePointObjLike[];
    triangles: ParseObjLike[];
    quadrilaterals: ParseObjLike[];
    segments: ParseObjLike[];
    angles: ParseObjLike[];
  };
  steps: ProofStepLike[];
  goal?: StmtLike;
};

const parseStepRef = (ref: string): number | null => {
  const raw = ref.replace(/\[|\]/g, "");
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }
  return null;
};

const stmtToText = (stmt?: StmtLike): string => {
  if (!stmt) return "";
  const args = stmt.arguments.map((a) => a.v).join(", ");
  return `${stmt.function}(${args})`;
};

const stepText = (content: string) => () =>
  React.createElement("span", null, content);

const normalizeStepNumber = (step: ProofStepLike, fallback: number): number => {
  const raw = step.stepNumber?.replace(/\[|\]/g, "") ?? "";
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const seedBaseContentFromPremises = (
  proof: ProofObjLike,
  content: DiagramContent,
): void => {
  proof.premises.points.forEach((pt) => {
    content.addPoint(
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
    const p1 = content.getPoint(seg.v[0]);
    const p2 = content.getPoint(seg.v[1]);
    if (p1 && p2) {
      content.addSegment({ p1: p1.obj as Point, p2: p2.obj as Point });
    }
  });

  proof.premises.triangles.forEach((tri) => {
    if (tri.v.length !== 3) return;
    const p1 = content.getPoint(tri.v[0]);
    const p2 = content.getPoint(tri.v[1]);
    const p3 = content.getPoint(tri.v[2]);
    if (p1 && p2 && p3) {
      content.addTriangle({
        pts: [p1.obj as Point, p2.obj as Point, p3.obj as Point],
      });
    }
  });

  proof.premises.quadrilaterals.forEach((quad) => {
    if (quad.v.length !== 4) return;
    const p1 = content.getPoint(quad.v[0]);
    const p2 = content.getPoint(quad.v[1]);
    const p3 = content.getPoint(quad.v[2]);
    const p4 = content.getPoint(quad.v[3]);
    if (p1 && p2 && p3 && p4) {
      content.addQuadrilateral({
        pts: [
          p1.obj as Point,
          p2.obj as Point,
          p3.obj as Point,
          p4.obj as Point,
        ],
      });
    }
  });

  proof.premises.angles.forEach((ang) => {
    if (ang.v.length !== 3) return;
    const start = content.getPoint(ang.v[0]);
    const center = content.getPoint(ang.v[1]);
    const end = content.getPoint(ang.v[2]);
    if (start && center && end) {
      content.addAngle({
        start: start.obj as Point,
        center: center.obj as Point,
        end: end.obj as Point,
      });
    }
  });
};

export const interactiveLayoutFromProofObj = (
  proof: ProofObjLike,
): InteractiveAppPageProps => {
  const ctx = new DiagramContent();
  const highlightCtx = new DiagramContent();
  const additionCtx = new DiagramContent();

  seedBaseContentFromPremises(proof, ctx);
  seedBaseContentFromPremises(proof, highlightCtx);
  seedBaseContentFromPremises(proof, additionCtx);

  ctx.addFrame(GIVEN_ID);
  ctx.addFrame(PROVE_ID);

  const linkedTexts: ProofTextItem[] = [];
  const reasonMap = new Map<string, Reason>();

  const givenSteps = proof.steps.filter((s) => s.type === "given");
  const proveStmt =
    proof.goal ?? proof.steps.find((s) => s.type === "goal")?.statement;

  linkedTexts.push({
    k: GIVEN_ID,
    v: stepText(givenSteps.map((s) => stmtToText(s.statement)).join("; ")),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: stepText(stmtToText(proveStmt)),
    alwaysActive: true,
  });

  const proofSteps = proof.steps.filter((s) => s.type === "proof");
  proofSteps.forEach((step, idx) => {
    const stepNumber = normalizeStepNumber(step, idx + 1);
    const frame = `s${stepNumber}`;
    ctx.addFrame(frame);
    highlightCtx.addFrame(frame);
    additionCtx.addFrame(frame);

    const depIds =
      step.reason?.arguments
        ?.map((ref) => parseStepRef(ref))
        .filter((n): n is number => n !== null)
        .map((n) => `s${n}`) ?? [];
    if (depIds.length > 0) {
      ctx.reliesOn(frame, depIds);
    }

    const reasonTitle = step.reason?.function ?? "";
    reasonMap.set(frame, { title: reasonTitle, body: "" });
    linkedTexts.push({
      k: frame,
      v: stepText(stmtToText(step.statement)),
      reason: reasonTitle,
      dependsOn: depIds.length > 0 ? new Set(depIds) : undefined,
    });
  });

  return {
    name: proof.title ?? "Imported proof",
    ctx: ctx.getCtx(),
    linkedTexts,
    reasonMap,
    isTutorial: false,
    highlightCtx: highlightCtx.getCtx(),
    additionCtx: additionCtx.getCtx(),
    diagramAspect: AspectRatio.Landscape,
  };
};
