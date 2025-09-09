import { DiagramContent } from "../../geometry/DiagramContent";
import { Point } from "../../geometry/Point";
import { Segment } from "../../geometry/Segment";
import { Stmt } from "../../types/checkerTypes";

export const reflex_s = (s1: Segment, s2: Segment) => {
  return s1.equals(s2);
};

export const altint = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  let [a1, a2] = conAng.arguments.map((arg) => tempCtx.addAngleFromStr(arg.v));
  const [s1p1, s1p2, p1, s2p1, s2p2, p2] = transversal.arguments.map((arg) =>
    tempCtx.getPoint(arg.v)
  );
  const [s1, s2, t] = [
    tempCtx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`),
    tempCtx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`),
    tempCtx.addSegmentFromStr(`${p1.label}${p2.label}`),
  ];
  let [pa1, pa2] = para.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg.v)
  );

  if (pa1.equals(s2) && pa2.equals(s1)) {
    // reassign so p1 and p2 correspond to s1 and s2
    [pa1, pa2] = [pa2, pa1];
  }
  if (!pa1.equals(s1) && !pa2.equals(s2)) {
    return false;
  }

  //check that parallel lines are same as s1/s2
  const segmentCheck = !pa1.equals(pa2) && !pa1.equals(t) && !pa2.equals(t);

  let angleCheck = false;
  // reaassign so that a1 is on s1 and a2 is on s2
  if (a1.centerEquals(t.p2) && a2.centerEquals(t.p1)) {
    [a1, a2] = [a2, a1];
  }
  // the corner of each angle must be on transversal
  if (a1.centerEquals(t.p1) && a2.centerEquals(t.p2)) {
    // one of the angle's points must be on the transversal
    if (a1.contains(t.p2) && a2.contains(t.p1)) {
      // if a1 contains s1p1 as endpoint then a2 must contain s2p2
      if (a1.contains(s1p1) && a2.contains(s2p2)) {
        angleCheck = true;
        // vice versa
      } else if (a1.contains(s1p2) && a2.contains(s2p1)) {
        angleCheck = true;
      }
    }
  } else {
    angleCheck = false;
  }
  if (segmentCheck && angleCheck) {
    conAng.arguments.map((arg) => ctx.addAngleFromStr(arg.v));
    ctx.addSegmentFromStr(`${p1.label}${p2.label}`);
    para.arguments.map((arg) => ctx.addSegmentFromStr(arg.v));
  }
  return segmentCheck && angleCheck;
};

export const midpt = (conSeg: Stmt, midPt: Stmt, ctx: DiagramContent) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2] = conSeg.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg.v)
  );
  const [bigSeg, midpt] = [
    tempCtx.addSegmentFromStr(midPt.arguments[0].v),
    tempCtx.getPoint(midPt.arguments[1].v),
  ];

  // segments declared to be congruent and be part of the line declared to be bisected
  const segmentsEqual =
    s1.getParentSegments().has(bigSeg) && s2.getParentSegments().has(bigSeg);

  // segments must contain midpoint, not be equal
  const segmentCheck =
    s1.contains(midpt) && s2.contains(midpt) && !s1.equals(s2);

  return segmentsEqual && segmentCheck;
};

export const perp = (right: Stmt, perp: Stmt, ctx: DiagramContent): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const angle = tempCtx.addAngleFromStr(right.arguments[0].v);

  let [s1, s2] = [
    tempCtx.addSegmentFromStr(perp.arguments[0].v),
    tempCtx.addSegmentFromStr(perp.arguments[1].v),
  ];
  const [intersectPt, intersectSeg] = getIntersectPt(s1, s2);
  console.log("intersectPt", intersectPt?.label);
  console.log("intersectSeg", intersectSeg?.label);
  if (intersectPt && intersectSeg) {
    if (intersectSeg.equals(s2)) {
      [s1, s2] = [s2, s1];
    }
    // check if angle has corner at intersectPt and 1 pt on each line
    return (
      angle.centerEquals(intersectPt) &&
      angle.contains(s1) &&
      (angle.contains(s2.p1) || angle.contains(s2.p2))
    );
  }
  return false;
};

export const perp_con_ang = (perp: Stmt, conAng: Stmt, ctx: DiagramContent) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2] = perp.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg.v)
  );
  const [a1, a2] = conAng.arguments.map((arg) =>
    tempCtx.addAngleFromStr(arg.v)
  );
  const [intersectPt, sharedSide] = getIntersectPt(s1, s2);
  if (intersectPt && sharedSide) {
    // TODO check for shared side AND angle made up of one point on the line
    return a1.centerEquals(intersectPt) && a2.centerEquals(intersectPt);
  }
  return false;
};

// ----- Helper functions -----
const getIntersectPt = (
  s1: Segment,
  s2: Segment
): [Point | undefined, Segment | undefined] => {
  // Check if s1.p1 is on s2
  if (s1.p1.isOnLine(s2)) {
    return [s1.p1, s1];
  }
  // Check if s1.p2 is on s2
  if (s1.p2.isOnLine(s2)) {
    return [s1.p2, s1];
  }
  // Check if s2.p1 is on s1
  if (s2.p1.isOnLine(s1)) {
    return [s2.p1, s2];
  }
  // Check if s2.p2 is on s1
  if (s2.p2.isOnLine(s1)) {
    return [s2.p2, s2];
  }
  // No intersection found
  return [undefined, undefined];
};
