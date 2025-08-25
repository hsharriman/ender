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

export const altint = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  let [a1, a2] = stripAngPrefix(conAng.arguments).map((arg) =>
    tempCtx.addAngleFromStr(arg)
  );
  const [s1p1, s1p2, p1, s2p1, s2p2, p2] = transversal.arguments.map((arg) =>
    tempCtx.getPoint(arg)
  );
  const [s1, s2, t] = [
    tempCtx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`),
    tempCtx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`),
    tempCtx.addSegmentFromStr(`${p1.label}${p2.label}`),
  ];
  let [pa1, pa2] = para.arguments.map((arg) => tempCtx.addSegmentFromStr(arg));

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
    console.log(a1.label, a2.label, t.label);
    // one of the angle's points must be on the transversal
    if (a1.contains(t.p2) && a2.contains(t.p1)) {
      // if a1 contains s1p1 as endpoint then a2 must contain s2p2
      console.log("a1 contains s1p1", a1.contains(s1p1));
      console.log("a2 contains s2p2", a2.contains(s2p2));
      console.log("a1 contains s1p2", a1.contains(s1p2));
      console.log("a2 contains s2p1", a2.contains(s2p1));
      if (a1.contains(s1p1) && a2.contains(s2p2)) {
        angleCheck = true;
        // vice versa
      } else if (a1.contains(s1p2) && a2.contains(s2p1)) {
        angleCheck = true;
      }
    }
  } else {
    return false;
  }
  return segmentCheck && angleCheck;
};

// export const altint = (
//   para: Stmt,
//   transversal: Stmt,
//   conAng: Stmt,
//   ctx: DiagramContent
// ): boolean => {
//   const tempCtx = new DiagramContent(ctx.getCtx());
//   const [pa1, pa2] = para.arguments.map((arg) =>
//     tempCtx.addSegmentFromStr(arg)
//   );
//   const [s1p1, s1p2, p1, s2p1, s2p2, p2] = transversal.arguments.map((arg) =>
//     tempCtx.getPoint(arg)
//   );
//   const [a1, a2] = conAng.arguments.map((arg) => tempCtx.addAngleFromStr(arg));

//     const [s1, s2, t] = [
//     tempCtx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`),
//     tempCtx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`),
//     tempCtx.addSegmentFromStr(`${p1.label}${p2.label}`),
//   ];
//   return false;
// };

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
