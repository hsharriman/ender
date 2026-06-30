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

  pcCtx.segments.forEach((seg) => ctx.addSegment(seg));
  pcCtx.angles.forEach((ang) => ctx.addAngle(ang));
  pcCtx.triangles.forEach((tri) => ctx.addTriangle(tri));
  pcCtx.quads.forEach((quad) => ctx.addQuadrilateral(quad));
  pcCtx.circles.forEach((circle) => ctx.addCircle(circle));

  return ctx;
};
