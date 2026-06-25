import { pointtoParseObj, segtoParseObj } from "checker/utils/utils";
import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import { createError } from "../errors/errorConstants";
import { ProofObj, Stmt } from "../types/checkerTypes";

export const buildPremises = (proof: ProofObj) => {
  // Create DiagramContent context and populate it with all geometric objects from premises
  const ctx = new ProofContent();
  const definedPtLabels = new Set(proof.premises.points.map((pt) => pt.v));

  // 1. Points
  proof.premises.points.forEach((pointObj) => {
    ctx.addPoint({ pt: pointObj.pt, label: pointObj.v });
  });

  // 2. Triangles, quadrilaterals, and circles — their sides/angles are created as a side-effect,
  // so proofs don't need to separately declare segments that are already sides of these shapes.
  proof.premises.triangles.forEach((triangleObj) => {
    for (const point of triangleObj.v.split("")) {
      if (!definedPtLabels.has(point))
        throw createError.parser.pointNotDefinedInPremises(point);
    }
    ctx.addTriangleFromStr(triangleObj.v);
  });

  proof.premises.quadrilaterals.forEach((quadrilateralObj) => {
    for (const point of quadrilateralObj.v.split("")) {
      if (!definedPtLabels.has(point))
        throw createError.parser.pointNotDefinedInPremises(point);
    }
    ctx.addQuadrilateralFromStr(quadrilateralObj.v);
  });

  proof.premises.circles.forEach((circleObj) => {
    for (const point of circleObj.v.split("")) {
      if (!definedPtLabels.has(point))
        throw createError.parser.pointNotDefinedInPremises(point);
    }
    ctx.addCircleFromStr(circleObj.v);
  });

  // 3. addVisibleObjects — creates segments for perp, intersect, transversal, etc.
  const addVisibleObjects = (ctx: ProofContent, statement: Stmt) => {
    switch (statement.function) {
      case "para":
      case "sim_seg":
      case "con_seg":
        addAllObjects(ctx, statement);
        break;
      case "perp":
        perpPremise(ctx, statement.arguments, proof);
        break;
      case "on_line":
        onLine(ctx, statement.arguments);
        break;
      case "perp_bisector": // all use (s1, s2, p)
      case "seg_bisect":
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
      case "kite_premise":
      case "trapezoid_premise":
      case "con_ang":
      case "right":
      case "ang_bisect":
      case "supplementary":
      case "complementary":
      case "rectangle":
      case "con_tri":
      case "con_right":
      case "isosceles":
      case "sim_tri":
      case "equilateral":
      case "equiangular":
      case "parallelogram":
      case "kite":
      case "isos_trapezoid":
      case "isos_trapezoid_premise":
      case "rhombus":
      case "trapezoid":
      // TODO implement
      case "circumcenter":
      case "incenter":
        break;
      // circle-related statements: add segment/angle objects they reference
      case "tangent":
      case "chord":
      case "diameter":
      case "inscribed_angle":
        addAllObjects(ctx, statement);
        break;
      case "radius":
      case "arc":
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

  // 4. Explicitly declared segments — idempotent for any already created by tris/quads/addVisibleObjects.
  proof.premises.segments.forEach((segmentObj) => {
    ctx.addSegmentFromStr(segmentObj.v);
  });

  // 5. Angle loop — runs after all segment creation so every possible angle is captured.
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

  // objects that rely on creation of segments before they can be created
  const addDependentObjects = (
    ctx: ProofContent,
    statement: Stmt,
    stepNum?: string,
  ): string[] => {
    switch (statement.function) {
      case "ang_bisect":
        angBisect(ctx, statement.arguments);
        break;
      case "kite_premise":
        kitePremise(ctx, statement.arguments);
        break;
      case "isos_trapezoid_premise":
      case "trapezoid_premise":
        return trapezoidPremise(ctx, statement.arguments, stepNum);
      case "con_ang":
      case "right":
      case "con_right":
      case "complementary":
      case "supplementary":
      case "isosceles":
      case "sim_tri":
      case "con_tri":
      case "equilateral":
      case "equiangular":
      case "rectangle":
      case "rhombus":
      case "parallelogram":
        addAllObjects(ctx, statement);
        break;
      case "perp":
      case "con_seg":
      case "on_line":
      case "seg_bisect":
      case "perp_bisector":
      case "intersect_seg":
      case "transversal":
      case "midpt":
      case "linear_pair":
      case "para":
      case "sim_seg":
      // TODO implement
      case "circumcenter":
      case "incenter":
      // circle-related statements (segment/angle objects already added in addVisibleObjects)
      case "tangent":
      case "chord":
      case "diameter":
      case "inscribed_angle":
      case "radius":
      case "arc":
        break;
      // during premises these reasons should use the premise counterpart
      case "kite":
      case "isos_trapezoid":
      case "trapezoid":
        throw createError.parser.premiseCounterpartRequired(statement.function);
      default:
        throw createError.parser.unknownStatementFunction(statement.function);
    }
    return [];
  };

  const premiseErrors: string[] = [];

  // process all other given steps
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      premiseErrors.push(...addDependentObjects(ctx, step.statement, step.stepNumber));
    }
  });

  // Process diagram-specific premises for the "other given" categories.
  proof.premises.diagramStatements.forEach((d) => {
    if (!d.statement?.function || !d.statement.arguments) return;
    premiseErrors.push(...addDependentObjects(ctx, d.statement, d.stepNumber));
  });

  ctx.checkAngleOverlaps();

  return { ctx, premiseErrors };
};

const trapezoidPremise = (
  ctx: ProofContent,
  args: ParseObj[],
  stepNum?: string,
): string[] => {
  const [quad, seg1, seg2] = args;
  const q = ctx.addQuadrilateralFromStr(quad.v, {
    type: "trapezoid",
    objs: [seg1.v, seg2.v],
  });
  const prefix = stepNum ? `[${stepNum}] ` : "";
  const b1 = seg1.v;
  const b2 = seg2.v;
  const ql = quad.v;
  const s1 = q.s.find((s) => s.names.has(b1));
  const s2 = q.s.find((s) => s.names.has(b2));
  if (!s1)
    return [`${prefix}Trapezoid base '${b1}' is not a side of quadrilateral '${ql}'`];
  if (!s2)
    return [`${prefix}Trapezoid base '${b2}' is not a side of quadrilateral '${ql}'`];
  if (s1.equals(s2))
    return [`${prefix}Trapezoid bases '${b1}' and '${b2}' must be two distinct sides of '${ql}'`];
  if (!q.isOppositeSides(s1, s2))
    return [`${prefix}Trapezoid bases '${b1}' and '${b2}' are consecutive sides of '${ql}' — bases must be the opposite (parallel) sides`];
  return [];
};

const kitePremise = (ctx: ProofContent, args: ParseObj[]) => {
  const [quad, ang1, ang2] = args;
  const q = ctx.addQuadrilateralFromStr(quad.v, {
    type: "kite",
    objs: [ang1.v, ang2.v],
  });
};

const perpPremise = (ctx: ProofContent, args: ParseObj[], proof: ProofObj) => {
  const [seg1, seg2, pt] = args;
  const s1 = ctx.addSegmentFromStr(seg1.v);
  const s2 = ctx.addSegmentFromStr(seg2.v);
  const p = ctx.getPoint(pt.v);
  if (s1.contains(p)) {
    // p is an endpoint of s1 — T-intersection into s2, so split s2 at p
    p.addOnLine(s2);
    seg2.v.split("").forEach((endPt) => {
      const subSeg = ctx.addSegmentFromStr(`${pt.v}${endPt}`);
      s2.addSubSegment(subSeg);
    });
  } else if (s2.contains(p)) {
    // p is an endpoint of s2 — T-intersection into s1, so split s1 at p
    p.addOnLine(s1);
    seg1.v.split("").forEach((endPt) => {
      const subSeg = ctx.addSegmentFromStr(`${pt.v}${endPt}`);
      s1.addSubSegment(subSeg);
    });
  } else {
    // p is interior to both segments — full cross-intersection
    intersectSeg(ctx, [seg1, seg2, pt], proof);
  }
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
      case Obj.Circle:
        ctx.addCircleFromStr(arg.v);
        break;
      default:
        break;
    }
  });
};
