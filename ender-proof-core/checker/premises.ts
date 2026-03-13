import { DiagramContent, Obj, ParseObj } from "geometry-object";
import { createError, logError } from "../errors/errorConstants";
import { ProofObj, Stmt } from "../types/checkerTypes";

export const buildPremises = (proof: ProofObj) => {
  // Create DiagramContent context and populate it with all geometric objects from premises
  const ctx = new DiagramContent();

  // Add all points from premises
  proof.premises.points.forEach((pointObj) => {
    const label = pointObj.v;
    ctx.addPoint({ pt: [0, 0], label }); // TODO pt coords
  });

  // loop through all pairs of points and create segments
  for (let i = 0; i < proof.premises.points.length; i++) {
    const point1 = ctx.getPoint(proof.premises.points[i].v);
    for (let j = i + 1; j < proof.premises.points.length; j++) {
      const point2 = ctx.getPoint(proof.premises.points[j].v);
      ctx.addSegment({ p1: point1, p2: point2 });
    }
  }

  // Process given statements involving segments
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      switch (step.statement.function) {
        case "con_seg":
          // TODO specify that something is being visually represented in given w this
          addAllObjects(ctx, step.statement);
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
        case "con_ang":
        case "right":
        case "ang_bisect":
        case "perp":
        case "rectangle":
          break;
        default:
          logError.parser.unknownStatementFunction(step.statement.function);
          throw createError.parser.unknownStatementFunction(
            step.statement.function,
          );
      }
    }
  });

  // ctx.ctx.segments.forEach((seg) => {
  //   console.log(
  //     seg.label,
  //     Array.from(seg.getParentSegments()).map((s) => s.label),
  //     Array.from(seg.getSubSegments()).map((s) => s.label)
  //   );
  // });

  // loop through points, create angles between all pairs of segments that contain that point
  proof.premises.points.forEach((pointObj) => {
    const pt = ctx.getPoint(pointObj.v);

    // Find all segments that contain this point
    const segmentsWithPoint = ctx.ctx.segments.filter(
      (seg) => seg.p1.equals(pt) || seg.p2.equals(pt),
    );

    // Create angles between all pairs of segments that contain this point
    for (let i = 0; i < segmentsWithPoint.length; i++) {
      const seg1 = segmentsWithPoint[i];
      for (let j = i + 1; j < segmentsWithPoint.length; j++) {
        const seg2 = segmentsWithPoint[j];

        // Find the other endpoints of the segments
        const otherPoint1 = seg1.p1.equals(pt) ? seg1.p2 : seg1.p1;
        const otherPoint2 = seg2.p1.equals(pt) ? seg2.p2 : seg2.p1;

        // Create angle with this point as center
        ctx.addAngle({
          start: otherPoint1,
          center: pt,
          end: otherPoint2,
        });
      }
    }
  });

  // loop through all sets of 3 points, create triangles
  for (let i = 0; i < proof.premises.points.length; i++) {
    const point1 = ctx.getPoint(proof.premises.points[i].v);
    for (let j = i + 1; j < proof.premises.points.length; j++) {
      const point2 = ctx.getPoint(proof.premises.points[j].v);
      for (let k = j + 1; k < proof.premises.points.length; k++) {
        const point3 = ctx.getPoint(proof.premises.points[k].v);
        ctx.addTriangle({ pts: [point1, point2, point3] });
      }
    }
  }

  // loop through all sets of 4 points, create quadrilaterals
  for (let i = 0; i < proof.premises.points.length; i++) {
    const point1 = ctx.getPoint(proof.premises.points[i].v);
    for (let j = i + 1; j < proof.premises.points.length; j++) {
      const point2 = ctx.getPoint(proof.premises.points[j].v);
      for (let k = j + 1; k < proof.premises.points.length; k++) {
        const point3 = ctx.getPoint(proof.premises.points[k].v);
        for (let l = k + 1; l < proof.premises.points.length; l++) {
          const point4 = ctx.getPoint(proof.premises.points[l].v);
          ctx.addQuadrilateral({
            pts: [point1, point2, point3, point4],
          });
        }
      }
    }
  }

  // // Add all triangles from premises (this will also create their segments and angles)
  // proof.premises.triangles.forEach((triangleObj) => {
  //   // Parse triangle label (e.g., "t_ABC")
  //   const pointLabels = triangleObj.v;
  //   ctx.addTriangleFromStr(pointLabels);
  // });

  // // Add all quadrilaterals from premises (this will also create their segments and angles)
  // proof.premises.quadrilaterals.forEach((quadrilateralObj) => {
  //   // Parse quadrilateral label (e.g., "q_ABCD")
  //   const pointLabels = quadrilateralObj.v;
  //   ctx.addQuadrilateralFromStr(pointLabels);
  // });

  // // Add all segments from premises
  // proof.premises.segments.forEach((segmentObj) => {
  //   ctx.addSegmentFromStr(segmentObj.v);
  // });

  // // Add all angles from premises
  // proof.premises.angles.forEach((angleObj) => {
  //   // Parse angle label (e.g., "a_BAC")
  //   const pointLabels = angleObj.v;
  //   ctx.addAngleFromStr(pointLabels);
  // });

  // process all other given steps
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      switch (step.statement.function) {
        case "con_ang":
          addAllObjects(ctx, step.statement);
          break;
        case "right":
          addAllObjects(ctx, step.statement);
          break;
        case "ang_bisect":
          angBisect(ctx, step.statement.arguments);
          break;
        case "perp":
          addAllObjects(ctx, step.statement);
          break;
        case "rectangle":
          addAllObjects(ctx, step.statement);
          break;
        case "con_seg":
        case "on_line":
        case "intersect_seg":
        case "transversal":
        case "midpt":
          break;
        default:
          logError.parser.unknownStatementFunction(step.statement.function);
          throw createError.parser.unknownStatementFunction(
            step.statement.function,
          );
      }
    }
  });

  ctx.checkAngleOverlaps();

  ctx.ctx.angles.forEach((a) => {
    console.log(a.label, [...Array.from(a.names)]);
  });
  return ctx;
};

const angBisect = (ctx: DiagramContent, args: ParseObj[]) => {
  const [ang, seg] = args;
  const a = ctx.addAngleFromStr(ang.v);
  const s = ctx.addSegmentFromStr(seg.v);
  const sharedPt = a.contains(s.p1)
    ? s.p2
    : a.contains(s.p2)
      ? s.p1
      : undefined;
  if (!sharedPt) {
    logError.parser.segmentAngleOverlapError(seg.v, ang.v);
    throw createError.parser.segmentAngleOverlapError(seg.v, ang.v);
  }
  ctx.addAngle({ center: a.center, start: a.start, end: sharedPt });
  ctx.addAngle({ center: a.center, start: a.end, end: sharedPt });
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
  proof: ProofObj,
) => {
  const [s1, s2, p] = args;

  // Check if the intersection point exists in premises
  if (!proof.premises.points.some((pt) => pt.v === p.v)) {
    logError.parser.pointNotDefinedInPremises(p.v);
    throw createError.parser.pointNotDefinedInPremises(p.v);
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
    ctx.getPoint(arg.v),
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
  ctx.addSegment({ p1: p, p2: s.p2 }).addParentSegment(s);
  ctx.addSegment({ p1: s.p1, p2: p }).addParentSegment(s);
};

const addAllObjects = (ctx: DiagramContent, stmt: Stmt) => {
  stmt.arguments.forEach((arg: ParseObj) => {
    switch (arg.type) {
      case Obj.Segment:
        ctx.addSegmentFromStr(arg.v);
        break;
      case Obj.Angle:
        ctx.addAngleFromStr(arg.v);
        break;
      case Obj.Triangle:
        ctx.addTriangleFromStr(arg.v);
        break;
      case Obj.Quadrilateral:
        ctx.addQuadrilateralFromStr(arg.v);
        break;
      default:
        break;
    }
  });
};
