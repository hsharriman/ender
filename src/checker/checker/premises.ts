import { pointtoParseObj, segtoParseObj } from "checker/utils/utils";
import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { createError } from "../errors/errorConstants";
import { ProofObj, Stmt } from "../types/checkerTypes";

export const buildPremises = (proof: ProofObj) => {
  // Create DiagramContent context and populate it with all geometric objects from premises
  const ctx = new ProofContent();

  // Add all points from premises
  proof.premises.points.forEach((pointObj) => {
    const label = pointObj.v;
    ctx.addPoint({ pt: pointObj.pt, label });
  });

  // Add all segments from premises
  proof.premises.segments.forEach((segmentObj) => {
    ctx.addSegmentFromStr(segmentObj.v);
  });

  const addVisibleObjects = (ctx: ProofContent, statement: Stmt) => {
    switch (statement.function) {
      case "para":
      case "sim_seg":
      case "con_seg":
        // TODO specify that something is being visually represented in given w this
        addAllObjects(ctx, statement);
        break;
      case "on_line":
        onLine(ctx, statement.arguments);
        break;
      case "intersect_seg":
        intersectSeg(ctx, statement.arguments, proof);
        break;
      case "transversal":
        transversal(ctx, statement.arguments, proof);
        break;
      case "midpt":
        midpt(ctx, statement.arguments);
        break;
      case "linear_pair":
        linearPair(ctx, statement.arguments);
        break;
      case "con_ang":
      case "right":
      case "ang_bisect":
      case "supplementary":
      case "complementary":
      case "perp":
      case "rectangle":
      // TODO implement
      case "con_tri":
      case "con_right":
      case "isosceles":
      case "parallelogram":
      case "sim_tri":
      case "equilateral":
      case "equilangular":
      case "seg_bisect":
      case "kite":
      case "perp_bisector":
      case "isos_trapezoid":
      case "rhombus":
      case "trapezoid":
      case "circumcenter":
      case "incenter":
        break;
      default:
        throw createError.parser.unknownStatementFunction(statement.function);
    }
  };

  // Process given statements involving segments
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      addVisibleObjects(ctx, step.statement);
    }
  });

  // Process diagram-specific premises the same way (they also affect the diagram context).
  proof.premises.diagramStatements.forEach(({ statement }) => {
    if (!statement?.function || !statement.arguments) return;
    addVisibleObjects(ctx, statement);
  });

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

  // // loop through all sets of 3 points, create triangles
  // for (let i = 0; i < proof.premises.points.length; i++) {
  //   const point1 = ctx.getPoint(proof.premises.points[i].v);
  //   for (let j = i + 1; j < proof.premises.points.length; j++) {
  //     const point2 = ctx.getPoint(proof.premises.points[j].v);
  //     for (let k = j + 1; k < proof.premises.points.length; k++) {
  //       const point3 = ctx.getPoint(proof.premises.points[k].v);
  //       ctx.addTriangle({ pts: [point1, point2, point3] });
  //     }
  //   }
  // }

  // // loop through all sets of 4 points, create quadrilaterals
  // for (let i = 0; i < proof.premises.points.length; i++) {
  //   const point1 = ctx.getPoint(proof.premises.points[i].v);
  //   for (let j = i + 1; j < proof.premises.points.length; j++) {
  //     const point2 = ctx.getPoint(proof.premises.points[j].v);
  //     for (let k = j + 1; k < proof.premises.points.length; k++) {
  //       const point3 = ctx.getPoint(proof.premises.points[k].v);
  //       for (let l = k + 1; l < proof.premises.points.length; l++) {
  //         const point4 = ctx.getPoint(proof.premises.points[l].v);
  //         ctx.addQuadrilateral({
  //           pts: [point1, point2, point3, point4],
  //         });
  //       }
  //     }
  //   }
  // }

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

  // // Add all angles from premises
  // proof.premises.angles.forEach((angleObj) => {
  //   // Parse angle label (e.g., "a_BAC")
  //   const pointLabels = angleObj.v;
  //   ctx.addAngleFromStr(pointLabels);
  // });

  // objects that rely on creation of segments before they can be created
  const addDependentObjects = (ctx: ProofContent, statement: Stmt) => {
    switch (statement.function) {
      case "ang_bisect":
        angBisect(ctx, statement.arguments);
        break;
      case "con_ang":
      case "right":
      case "complementary":
      case "supplementary":
      case "perp":
      case "rectangle":
        addAllObjects(ctx, statement);
        break;
      case "con_seg":
      case "on_line":
      case "intersect_seg":
      case "transversal":
      case "midpt":
      case "linear_pair":
      case "para":
      // TODO implement
      case "con_tri":
      case "con_right":
      case "isosceles":
      case "parallelogram":
      case "sim_seg":
      case "sim_tri":
      case "equilateral":
      case "equilangular":
      case "seg_bisect":
      case "kite":
      case "perp_bisector":
      case "isos_trapezoid":
      case "rhombus":
      case "trapezoid":
      case "circumcenter":
      case "incenter":
        break;
      default:
        throw createError.parser.unknownStatementFunction(statement.function);
    }
  };

  // process all other given steps
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      addDependentObjects(ctx, step.statement);
    }
  });

  // Process diagram-specific premises for the "other given" categories.
  proof.premises.diagramStatements.forEach(({ statement }) => {
    if (!statement?.function || !statement.arguments) return;
    addDependentObjects(ctx, statement);
  });

  ctx.checkAngleOverlaps();

  return ctx;
};

const angBisect = (ctx: ProofContent, args: ParseObj[]) => {
  const [ang, seg] = args;
  const a = ctx.addAngleFromStr(ang.v);
  const s = ctx.addSegmentFromStr(seg.v);
  const sharedPt = a.contains(s.p1)
    ? s.p2
    : a.contains(s.p2)
      ? s.p1
      : undefined;
  if (!sharedPt) {
    throw createError.parser.segmentAngleOverlapError(seg.v, ang.v);
  }
  ctx.addAngle({ center: a.center, start: a.start, end: sharedPt });
  ctx.addAngle({ center: a.center, start: a.end, end: sharedPt });
};

const onLine = (ctx: ProofContent, args: ParseObj[]) => {
  const [seg, pt] = args;
  const s = ctx.addSegmentFromStr(seg.v);
  const p = ctx.getPoint(pt.v);
  p.addOnLine(s);
  const ps2 = ctx.addSegmentFromStr(`${p.label}${s.p2.label}`);
  const ps1 = ctx.addSegmentFromStr(`${s.p1.label}${p.label}`);
  ps1.addParentSegment(s);
  ps2.addParentSegment(s);
};

const intersectSeg = (ctx: ProofContent, args: ParseObj[], proof: ProofObj) => {
  const [s1, s2, p] = args;

  // Check if the intersection point exists in premises
  if (!proof.premises.points.some((pt) => pt.v === p.v)) {
    throw createError.parser.pointNotDefinedInPremises(p.v);
  }

  const seg1 = ctx.addSegmentFromStr(s1.v);
  const seg2 = ctx.addSegmentFromStr(s2.v);
  const ip = ctx.getPoint(p.v);

  ip.addOnLine(seg1);
  ip.addOnLine(seg2);

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

const transversal = (ctx: ProofContent, args: ParseObj[], proof: ProofObj) => {
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = args.map((arg) =>
    ctx.getPoint(arg.v),
  );
  const seg1 = ctx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`);
  const seg2 = ctx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`);
  const transversalSeg = ctx.addSegmentFromStr(`${t1.label}${t2.label}`);

  const intersectionsAtTransversalEndpoints =
    (i1.equals(t1) && i2.equals(t2)) || (i1.equals(t2) && i2.equals(t1));

  if (!intersectionsAtTransversalEndpoints) {
    intersectSeg(
      ctx,
      [segtoParseObj(seg1), segtoParseObj(transversalSeg), pointtoParseObj(i1)],
      proof,
    );
    intersectSeg(
      ctx,
      [segtoParseObj(seg2), segtoParseObj(transversalSeg), pointtoParseObj(i2)],
      proof,
    );
    const innerT = ctx.addSegmentFromStr(`${i1.label}${i2.label}`);
    innerT.addParentSegment(transversalSeg);
  } else {
    // i1 and i2 are the same as t1 and t2, just add them to on_line
    i1.addOnLine(seg1);
    i1.addOnLine(transversalSeg);
    i2.addOnLine(seg2);
    i2.addOnLine(transversalSeg);
  }
};

const midpt = (ctx: ProofContent, args: ParseObj[]) => {
  const [seg, pt] = args;
  const s = ctx.addSegmentFromStr(seg.v);
  const p = ctx.getPoint(pt.v);
  p.addOnLine(s);
  ctx.addSegment({ p1: p, p2: s.p2 }).addParentSegment(s);
  ctx.addSegment({ p1: s.p1, p2: p }).addParentSegment(s);
};

const linearPair = (ctx: ProofContent, args: ParseObj[]) => {
  const [a1, a2] = args.map((arg) => ctx.addAngleFromStr(arg.v));
  const p = ctx.getPoint(a1.center.label);
  const sharedSide = a1.sharedSide(a2);
  if (sharedSide) {
    ctx.addSegmentFromStr(sharedSide.shared);
    // remaining points form the other side of linear pair
    const linearSide = ctx.addSegmentFromStr(
      `${sharedSide.thisThird}${sharedSide.otherThird}`,
    );
    p.addOnLine(linearSide);
  }
};

const addAllObjects = (ctx: ProofContent, stmt: Stmt) => {
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
