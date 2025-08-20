import { DiagramContent } from "../../geometry/DiagramContent";
import { Point } from "../../geometry/Point";
import { Segment } from "../../geometry/Segment";
import { Stmt } from "../../types/types";
import { stripAngPrefix } from "./utils";

export const reflex_s = (s1: Segment, s2: Segment) => {
  return s1.equals(s2);
};

export const intersect_seg = (
  intersect_seg: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2, pt]: [Segment, Segment, Point] = [
    tempCtx.addSegmentFromStr(intersect_seg.arguments[0]),
    tempCtx.addSegmentFromStr(intersect_seg.arguments[1]),
    tempCtx.getPoint(intersect_seg.arguments[2]),
  ];
  //  check that s1 and s2 are not the same, and p is not in s1 or s2 labels
  const valid = !s1.equals(s2) && !s1.contains(pt) && !s2.contains(pt);
  // if valid, add new objects to context
  if (valid) {
    s1.label.split("").forEach((p) => ctx.addSegmentFromStr(`${p}${pt.label}`));
    s2.label.split("").forEach((p) => ctx.addSegmentFromStr(`${p}${pt.label}`));
    ctx.addSegmentFromStr(s1.label);
    ctx.addSegmentFromStr(s2.label);
  }

  return valid;
};

export const altint_conv = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [a1, a2] = stripAngPrefix(conAng.arguments).map((arg) =>
    tempCtx.addAngleFromStr(arg)
  );
  const [s1, s2, t] = transversal.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg)
  );
  let [p1, p2] = para.arguments.map((arg) => tempCtx.addSegmentFromStr(arg));

  if (p1.equals(s1) && p2.equals(s2)) {
    // do nothing
  } else if (p1.equals(s2) && p2.equals(s1)) {
    // reassign so p1 and p2 correspond to s1 and s2
    [p1, p2] = [p2, p1];
  } else {
    return false;
  }

  //check that parallel lines are same as s1/s2
  const segmentCheck = !p1.equals(p2) && !p1.equals(t) && !p2.equals(t);

  let angleCheck = false;
  if (a1.centerEquals(t.p1) && a2.centerEquals(t.p2)) {
    if (a1.contains(t.p2) && a2.contains(t.p1)) {
      // TODO need a check about whether the third point is on the correct parallel line
      // need to know what line the transversal's point is intersecting with
      angleCheck = true;
    }
  } else if (a1.centerEquals(t.p2) && a2.centerEquals(t.p1)) {
    if (a1.contains(t.p1) && a2.contains(t.p2)) {
      // TODO need a check about whether the third point is on the correct parallel line
      // need to know what line the transversal's point is intersecting with
      angleCheck = true;
    }
  }
  return segmentCheck && angleCheck;
};

export const altint = (
  para: Stmt,
  transversal: Stmt,
  conAng: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [p1, p2] = para.arguments.map((arg) => tempCtx.addSegmentFromStr(arg));
  const [t1, t2, tr] = transversal.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg)
  );
  return false;
};

export const perp = (
  right: Stmt,
  onLine: Stmt,
  perp: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [r, l, p] = [
    tempCtx.addSegmentFromStr(right.arguments[0]),
    tempCtx.addSegmentFromStr(onLine.arguments[0]),
    tempCtx.addSegmentFromStr(perp.arguments[0]),
  ];

  return false;
};

// ----- Helper functions -----
