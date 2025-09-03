import { logError } from "../errors/errorConstants";
import { DiagramContent } from "../geometry/DiagramContent";
import { ParseObj, ProofObj } from "../types/checkerTypes";
import { Obj } from "../types/types";

export const buildPremises = (proof: ProofObj) => {
  // Create DiagramContent context and populate it with all geometric objects from premises
  const ctx = new DiagramContent();

  // Add all points from premises
  proof.premises.points.forEach((pointObj) => {
    const label = pointObj.v;
    ctx.addPoint({ pt: [0, 0], label, offset: [0, 0] }); // TODO pt coords
  });

  // Add all triangles from premises (this will also create their segments and angles)
  proof.premises.triangles.forEach((triangleObj) => {
    // Parse triangle label (e.g., "t_ABC")
    const pointLabels = triangleObj.v;
    ctx.addTriangleFromStr(pointLabels);
  });

  // Add all quadrilaterals from premises (this will also create their segments and angles)
  proof.premises.quadrilaterals.forEach((quadrilateralObj) => {
    // Parse quadrilateral label (e.g., "q_ABCD")
    const pointLabels = quadrilateralObj.v;
    ctx.addQuadrilateralFromStr(pointLabels);
  });

  // Add all segments from premises
  proof.premises.segments.forEach((segmentObj) => {
    ctx.addSegmentFromStr(segmentObj.v);
  });

  // Add all angles from premises
  proof.premises.angles.forEach((angleObj) => {
    // Parse angle label (e.g., "a_BAC")
    const pointLabels = angleObj.v;
    ctx.addAngleFromStr(pointLabels);
  });

  // Process given statements to create geometric objects
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      switch (step.statement.function) {
        case "con_seg":
          step.statement.arguments.forEach((arg: ParseObj) => {
            ctx.addSegmentFromStr(arg.v);
          });
          break;
        case "con_ang":
          step.statement.arguments.forEach((arg: ParseObj) => {
            if (arg.type === Obj.Angle) {
              ctx.addAngleFromStr(arg.v);
            }
          });
          break;
        case "on_line":
          onLine(ctx, step.statement.arguments);
          break;
        case "intersect_seg":
          intersectSeg(ctx, step.statement.arguments, proof);
          break;
        case "transversal":
          transversal(ctx, step.statement.arguments);
          break;
        case "midpt":
          midpt(ctx, step.statement.arguments);
          break;
        default:
          throw new Error(
            `Unknown statement function: ${step.statement.function}`
          );
      }
    }
  });
  return ctx;
};

const onLine = (ctx: DiagramContent, args: ParseObj[]) => {
  const [seg, pt] = args;
  const s = ctx.addSegmentFromStr(seg.v);
  const p = ctx.getPoint(pt.v);
  p.addOnLine(s);
  const ps2 = ctx.addSegmentFromStr(`${p.label}${s.p2.label}`);
  const ps1 = ctx.addSegmentFromStr(`${s.p1.label}${p.label}`);
  ps1.addParentSegment(s);
  ps2.addParentSegment(s);
};

const intersectSeg = (
  ctx: DiagramContent,
  args: ParseObj[],
  proof: ProofObj
) => {
  const [s1, s2, p] = args;

  // Check if the intersection point exists in premises
  if (!proof.premises.points.some((pt) => pt.v === p.v)) {
    logError.parser.missingPointInPremises(p.v);
    throw new Error(
      `Point '${p}' is used in intersect_seg but not defined in premises`
    );
  }

  const seg1 = ctx.addSegmentFromStr(s1.v);
  const seg2 = ctx.addSegmentFromStr(s2.v);
  const ip = ctx.getPoint(p.v);

  s1.v.split("").forEach((pt) => {
    const subSeg = ctx.addSegmentFromStr(`${ip.label}${pt}`);
    seg1.addSubSegment(subSeg);
    subSeg.addParentSegment(seg1);
  });
  s2.v.split("").forEach((pt) => {
    const subSeg = ctx.addSegmentFromStr(`${ip.label}${pt}`);
    seg2.addSubSegment(subSeg);
    subSeg.addParentSegment(seg2);
  });
};

const transversal = (ctx: DiagramContent, args: ParseObj[]) => {
  const [s1p1, s1p2, p1, s2p1, s2p2, p2] = args.map((arg) =>
    ctx.getPoint(arg.v)
  );
  const seg1 = ctx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`);
  const seg2 = ctx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`);
  ctx.addSegmentFromStr(`${p1.label}${p2.label}`);
  p1.addOnLine(seg1);
  p2.addOnLine(seg2);
};

const midpt = (ctx: DiagramContent, args: ParseObj[]) => {
  const [seg, pt] = args;
  const s = ctx.addSegmentFromStr(seg.v);
  const p = ctx.getPoint(pt.v);
  p.addOnLine(s);
  ctx.addSegmentFromStr(`${p.label}${s.p2.label}`).addParentSegment(s);
  ctx.addSegmentFromStr(`${s.p1.label}${p.label}`).addParentSegment(s);
};
