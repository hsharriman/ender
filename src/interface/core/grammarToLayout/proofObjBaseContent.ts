import { ProofObj } from "checker/types/checkerTypes";
import { DiagramContent } from "../builder/DiagramContent";
import { ShowPoint } from "../types/diagramTypes";

export const seedBaseContentFromPremises = (proof: ProofObj): DiagramContent => {
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

