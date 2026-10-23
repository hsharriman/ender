import { ProofObj, Stmt } from "checker/types/checkerTypes";
import { Obj, ParseObj, ProofContent } from "geometry-object";

/**
 * Construct the geometric objects needed to draw a parsed presentation: the
 * declared objects, the segments and points that premises such as
 * `intersect_seg` or `transversal` imply, and the angles those segments make.
 * This function deliberately performs no proof checking: acceptance and all
 * diagnostics come from the extracted Rocq checker.
 */
export const presentationContent = (proof: ProofObj): ProofContent => {
  const ctx = new ProofContent();
  const definedPoints = new Set(proof.premises.points.map((point) => point.v));
  const pointsDefined = (statement: Stmt): boolean =>
    statement.arguments.every(
      (arg) =>
        arg.type === Obj.Text ||
        arg.v.split("").every((label) => definedPoints.has(label)),
    );

  proof.premises.points.forEach((point) =>
    ctx.addPoint({ label: point.v, pt: point.pt }),
  );
  // Triangles, quadrilaterals, and circles create their sides and angles, so
  // proofs need not declare those segments separately.
  proof.premises.triangles.forEach((object) =>
    ctx.addTriangleFromStr(object.v),
  );
  proof.premises.quadrilaterals.forEach((object) =>
    ctx.addQuadrilateralFromStr(object.v),
  );
  proof.premises.circles.forEach((object) => ctx.addCircleFromStr(object.v));
  proof.premises.segments.forEach((object) => ctx.addSegmentFromStr(object.v));
  proof.premises.angles.forEach((object) => addAngleWithSides(ctx, object.v));

  const premiseStatements = [
    ...proof.steps.filter((step) => step.type === "given"),
    ...proof.premises.diagramStatements,
  ]
    .map((step) => step.statement)
    .filter((statement): statement is Stmt => !!statement)
    .filter(pointsDefined);

  premiseStatements.forEach((statement) => addVisibleObjects(ctx, statement));
  addAnglesAtSharedPoints(ctx, proof);
  premiseStatements.forEach((statement) => addDependentObjects(ctx, statement));

  // Steps and the goal may name objects no premise implies.
  proof.steps
    .filter((step) => step.type === "proof")
    .map((step) => step.statement)
    .concat(proof.goal)
    .filter((statement): statement is Stmt => !!statement)
    .filter(pointsDefined)
    .forEach((statement) =>
      statement.arguments.forEach((arg) => addObject(ctx, arg)),
    );

  ctx.checkAngleOverlaps();
  return ctx;
};

const addAngleWithSides = (ctx: ProofContent, name: string) => {
  if (name.length !== 3) return;
  ctx.addSegmentFromStr(name.slice(0, 2));
  ctx.addSegmentFromStr(name.slice(1, 3));
  ctx.addAngleFromStr(name);
};

const addObject = (ctx: ProofContent, arg: ParseObj) => {
  switch (arg.type) {
    case Obj.Segment:
      ctx.addSegmentFromStr(arg.v);
      break;
    case Obj.Angle:
      addAngleWithSides(ctx, arg.v);
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
};

const addAllObjects = (ctx: ProofContent, statement: Stmt) =>
  statement.arguments.forEach((arg) => {
    // Unlike step conclusions, premise angles do not draw their sides.
    if (arg.type === Obj.Angle) ctx.addAngleFromStr(arg.v);
    else addObject(ctx, arg);
  });

/** Objects a premise makes visible: segments, crossings, and circle points. */
const addVisibleObjects = (ctx: ProofContent, statement: Stmt) => {
  const args = statement.arguments;
  switch (statement.function) {
    case "para":
    case "center_on_line":
    case "proportion":
    case "con_seg":
      addAllObjects(ctx, statement);
      break;
    case "perp":
      perpPremise(ctx, args);
      break;
    case "on_line":
      onLine(ctx, args);
      break;
    case "perp_bisector":
    case "seg_bisect":
    case "intersect_seg":
      intersectSeg(ctx, args);
      break;
    case "transversal":
      transversal(ctx, args);
      break;
    case "midpt":
      midpt(ctx, args);
      break;
    case "linear_pair":
      linearPair(ctx, args);
      break;
    case "chord":
    case "diameter":
    case "on_circle":
    case "radius":
      circlePremise(ctx, statement);
      break;
    case "inscribed_angle":
      inscribedAngle(ctx, args);
      break;
    case "circ_order":
      circOrder(ctx, args);
      break;
    case "tangent":
      tangentPremise(ctx, statement);
      break;
    default:
      break;
  }
};

/** Objects that need the segments above to exist first. */
const addDependentObjects = (ctx: ProofContent, statement: Stmt) => {
  const args = statement.arguments;
  switch (statement.function) {
    case "ang_bisect":
      angBisect(ctx, args);
      break;
    case "kite_premise":
      ctx.addQuadrilateralFromStr(args[0].v, {
        type: "kite",
        objs: [args[1].v, args[2].v],
      });
      break;
    case "isos_trapezoid_premise":
    case "trapezoid_premise":
      ctx.addQuadrilateralFromStr(args[0].v, {
        type: "trapezoid",
        objs: [args[1].v, args[2].v],
      });
      break;
    case "con_ang":
    case "right":
    case "con_right":
    case "complementary":
    case "supplementary":
    case "isosceles":
    case "sim_tri":
    case "con_tri":
    case "con_tri_ordered":
    case "equilateral":
    case "equiangular":
    case "rectangle":
    case "rhombus":
    case "parallelogram":
      addAllObjects(ctx, statement);
      break;
    default:
      break;
  }
};

/** Create an angle between every pair of segments that share an endpoint. */
const addAnglesAtSharedPoints = (ctx: ProofContent, proof: ProofObj) =>
  proof.premises.points.forEach((pointObj) => {
    const pt = ctx.getPoint(pointObj.v);
    const segments = ctx.ctx.segments.filter(
      (seg) => seg.p1.equals(pt) || seg.p2.equals(pt),
    );
    for (let i = 0; i < segments.length; i++) {
      const start = segments[i].p1.equals(pt) ? segments[i].p2 : segments[i].p1;
      for (let j = i + 1; j < segments.length; j++) {
        const end = segments[j].p1.equals(pt) ? segments[j].p2 : segments[j].p1;
        ctx.addAngle({ start, center: pt, end });
      }
    }
  });

// Each puts its points on the circle, which registers the circle's other
// names: `c_OB` for `c_OA`.
const circlePremise = (ctx: ProofContent, statement: Stmt) => {
  const [circle, object] = statement.arguments;
  statement.arguments.forEach((arg) => addObject(ctx, arg));
  const c = ctx.getCircle(circle.v);
  object.v.split("").forEach((label) => c.addPt(ctx.getPoint(label)));
};

// Only the vertex is on the circle; the rays are drawn to the points that
// name them, which may lie beyond it.
const inscribedAngle = (ctx: ProofContent, [circle, angle]: ParseObj[]) => {
  addObject(ctx, circle);
  addObject(ctx, angle);
  ctx.getCircle(circle.v).addPt(ctx.getPoint(angle.v[1]));
};

const circOrder = (ctx: ProofContent, [circle, ...points]: ParseObj[]) => {
  const c = ctx.addCircleFromStr(circle.v);
  points.forEach((point) => c.addPt(ctx.getPoint(point.v)));
};

const tangentPremise = (ctx: ProofContent, statement: Stmt) => {
  addAllObjects(ctx, statement);
  const [circle, , point] = statement.arguments;
  ctx.getCircle(circle.v).addPt(ctx.getPoint(point.v));
};

const perpPremise = (ctx: ProofContent, args: ParseObj[]) => {
  const [seg1, seg2, point] = args;
  const s1 = ctx.addSegmentFromStr(seg1.v);
  const s2 = ctx.addSegmentFromStr(seg2.v);
  const p = ctx.getPoint(point.v);
  // An endpoint of one segment meets the other in a T: split the other at it.
  const split = (onto: typeof s1, label: string) => {
    label.split("").forEach((end) => {
      onto.addSubSegment(ctx.addSegmentFromStr(`${point.v}${end}`));
    });
  };
  if (s1.contains(p)) split(s2, seg2.v);
  else if (s2.contains(p)) split(s1, seg1.v);
  else intersectSeg(ctx, args);
};

const angBisect = (ctx: ProofContent, args: ParseObj[]) => {
  const [angle, segment] = args;
  const a = ctx.addAngleFromStr(angle.v);
  const s = ctx.addSegmentFromStr(segment.v);
  const ray = a.contains(s.p1) ? s.p2 : a.contains(s.p2) ? s.p1 : undefined;
  if (!ray) return;
  ctx.addAngle({ center: a.center, start: a.start, end: ray });
  ctx.addAngle({ center: a.center, start: a.end, end: ray });
};

const onLine = (ctx: ProofContent, args: ParseObj[]) => {
  const [segment, point] = args;
  const s = ctx.addSegmentFromStr(segment.v);
  const p = ctx.getPoint(point.v);
  ctx.addSegmentFromStr(`${s.p1.label}${p.label}`).addParentSegment(s);
  ctx.addSegmentFromStr(`${p.label}${s.p2.label}`).addParentSegment(s);
};

const intersectSeg = (ctx: ProofContent, args: ParseObj[]) => {
  const [seg1, seg2, point] = args;
  const crossing = ctx.getPoint(point.v);
  [seg1, seg2].forEach((segment) => {
    const s = ctx.addSegmentFromStr(segment.v);
    segment.v.split("").forEach((end) => {
      const sub = ctx.addSegmentFromStr(`${crossing.label}${end}`);
      s.addSubSegment(sub);
      sub.addParentSegment(s);
    });
  });
};

const segmentObj = (v: string): ParseObj => ({ type: Obj.Segment, v });
const pointObj = (v: string): ParseObj => ({ type: Obj.Point, v });

const transversal = (ctx: ProofContent, args: ParseObj[]) => {
  if (args.length !== 8) return;
  const [a, b, t1, i1, c, d, t2, i2] = args.map((arg) => arg.v);
  const line = `${t1}${t2}`;
  ctx.addSegmentFromStr(`${a}${b}`);
  ctx.addSegmentFromStr(`${c}${d}`);
  const t = ctx.addSegmentFromStr(line);
  // A transversal that stops at its crossings splits nothing.
  const atEndpoints = (i1 === t1 && i2 === t2) || (i1 === t2 && i2 === t1);
  if (!atEndpoints) {
    intersectSeg(ctx, [segmentObj(`${a}${b}`), segmentObj(line), pointObj(i1)]);
    intersectSeg(ctx, [segmentObj(`${c}${d}`), segmentObj(line), pointObj(i2)]);
    ctx.addSegmentFromStr(`${i1}${i2}`).addParentSegment(t);
  }
};

const midpt = (ctx: ProofContent, args: ParseObj[]) => {
  const [segment, point] = args;
  const s = ctx.addSegmentFromStr(segment.v);
  const p = ctx.getPoint(point.v);
  ctx.addSegment({ p1: p, p2: s.p2 }).addParentSegment(s);
  ctx.addSegment({ p1: s.p1, p2: p }).addParentSegment(s);
};

const linearPair = (ctx: ProofContent, args: ParseObj[]) => {
  const [a1, a2] = args.map((arg) => ctx.addAngleFromStr(arg.v));
  const shared = a1.sharedSide(a2);
  if (!shared) return;
  ctx.addSegmentFromStr(shared.shared);
  ctx.addSegmentFromStr(`${shared.thisThird}${shared.otherThird}`);
};
