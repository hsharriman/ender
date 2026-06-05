import { ProofObj } from "checker/types/checkerTypes";
import { ProofContent } from "geometry-object";
import { DiagramContent } from "../builder/DiagramContent";
import { ShowPoint } from "../types/diagramTypes";
import { resolvePointLabelOffset } from "./pointLabelOffset";

export const seedBaseContentFromPremises = (
  proof: ProofObj,
  checkerCtx: ProofContent,
): DiagramContent => {
  const ctx = new DiagramContent();

  // Points must be added first — they carry coordinate and label-offset data that
  // only the proof file knows about, and all other adders look up by label.
  proof.premises.points.forEach((pt) => {
    ctx.addPoint(
      { label: pt.v, pt: pt.pt },
      resolvePointLabelOffset(pt.offsetCode),
      ShowPoint.Hide,
    );
  });

  // Mirror every object from the checker's already-computed ProofContent into
  // DiagramContent by looking up points by label to get the diagram-side instances.
  const pcCtx = checkerCtx.getCtx();

  pcCtx.segments.forEach((seg) => {
    const p1 = ctx.getPoint(seg.p1.label);
    const p2 = ctx.getPoint(seg.p2.label);
    if (p1 && p2) ctx.addSegment({ p1: p1.obj, p2: p2.obj });
  });

  pcCtx.angles.forEach((ang) => {
    const start = ctx.getPoint(ang.start.label);
    const center = ctx.getPoint(ang.center.label);
    const end = ctx.getPoint(ang.end.label);
    if (start && center && end)
      ctx.addAngle({ start: start.obj, center: center.obj, end: end.obj });
  });

  pcCtx.triangles.forEach((tri) => {
    const [p1, p2, p3] = tri.p.map((p) => ctx.getPoint(p.label));
    if (p1 && p2 && p3) ctx.addTriangle({ pts: [p1.obj, p2.obj, p3.obj] });
  });

  pcCtx.rectangles.forEach((quad) => {
    const [p1, p2, p3, p4] = quad.p.map((p) => ctx.getPoint(p.label));
    if (p1 && p2 && p3 && p4)
      ctx.addQuadrilateral({ pts: [p1.obj, p2.obj, p3.obj, p4.obj] });
  });

  return ctx;
};
