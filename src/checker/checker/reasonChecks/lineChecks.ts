import { ProofContent, Segment } from "../../../geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { findDuplicateDependencyStatements } from "./utils";

export const reflex_s = (s1: Segment, s2: Segment) => {
  return s1.equals(s2);
};

export const altint = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): boolean => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return false;
  const [s1p1, s1p2, , , s2p1, s2p2, ,] = res.pts;
  const [, innerT] = res.segs;
  const [a1, a2] = res.angles;

  // the corner of each angle must be on transversal
  if (a1.centerEquals(innerT.p1) && a2.centerEquals(innerT.p2)) {
    // one of the angle's points must be on the transversal
    if (a1.contains(innerT.p2) && a2.contains(innerT.p1)) {
      // if a1 contains s1p1 as endpoint then a2 must contain s2p2
      // opposite angles check
      if (
        (a1.contains(s1p1) && a2.contains(s2p2)) ||
        (a1.contains(s1p2) && a2.contains(s2p1))
      ) {
        return true;
      }
    }
  }
  return false;
};

export const altext = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): boolean => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return false;
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = res.pts;
  const [t] = res.segs;
  const [a1, a2] = res.angles;

  // cannot work if the transversal's endpoints are the intersections with s1 and/or s2.
  if (t1.equals(i1) || t2.equals(i2)) {
    return false;
  }

  //check that int points are on the transversal
  const segmentCheck = i1.isOnLine(t) && i2.isOnLine(t);

  let angleCheck = false;
  // the corner of each angle must be intersections of transversal
  if (a1.centerEquals(i1) && a2.centerEquals(i2)) {
    // each angle's endpoint must be the transversal's endpoint
    if (a1.contains(t1) && a2.contains(t2)) {
      // if a1 contains s1p1 as endpoint then a2 must contain s2p2, vice versa
      // opposite angles check
      if (
        (a1.contains(s1p1) && a2.contains(s2p2)) ||
        (a1.contains(s1p2) && a2.contains(s2p1))
      ) {
        angleCheck = true;
      }
    }
  }
  return segmentCheck && angleCheck;
};

export const sameside = (
  supplementary: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): boolean => {
  const res = transversalHelper(ctx, transversal, supplementary, para);
  if (!res.ok) return false;
  const [s1p1, s1p2, , i1, s2p1, s2p2, , i2] = res.pts;
  const [a1, a2] = res.angles;

  // the corner of each angle must be on transversal
  if (a1.centerEquals(i1) && a2.centerEquals(i2)) {
    // each angle's endpoint must be the other intersection pt
    if (a1.contains(i2) && a2.contains(i1)) {
      // same-side check: if a1 contains s1p1 as endpoint then a2 must contain s2p1, vice versa
      if (
        (a1.contains(s1p1) && a2.contains(s2p1)) ||
        (a1.contains(s1p2) && a2.contains(s2p2))
      ) {
        return true;
      }
    }
  }
  return false;
};

// TODO
export const corresp_ang = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): boolean => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return false;
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = res.pts;
  const [t] = res.segs;
  const [a1, a2] = res.angles;

  // cannot work if the transversal's endpoints are the intersections with s1 and/or s2.
  if (t1.equals(i1) || t2.equals(i2)) {
    return false;
  }

  //check that intersection points are on the transversal
  const segmentCheck = i1.isOnLine(t) && i2.isOnLine(t);

  // the corner of each angle must be the intersection of transversal
  let angleCheck = a1.centerEquals(i1) && a2.centerEquals(i2);

  // one angle always has the other angle as an endpoint, and the other has the closest transversal endpoint as endpt
  // both angle's 3rd endpoint must face the same direction

  // case 1: a1 contains i2; case 2: a2 contains i1
  if (
    (a1.contains(i2) && a2.contains(t2)) ||
    (a2.contains(i1) && a1.contains(t1))
  ) {
    // if a1 contains s1p1 as endpoint then a2 must contain s2p1 or vice versa
    if (
      (a1.contains(s1p1) && a2.contains(s2p1)) ||
      (a1.contains(s1p2) && a2.contains(s2p2))
    ) {
      angleCheck = true;
    }
  }
  return segmentCheck && angleCheck;
};

export const midpt = (conSeg: Stmt, midPt: Stmt, ctx: ProofContent) => {
  const [s1, s2] = conSeg.arguments.map((arg) => ctx.getSegment(arg.v));
  if (s1.equals(s2)) return false;
  const [bigSeg, midpt] = [
    ctx.getSegment(midPt.arguments[0].v),
    ctx.getPoint(midPt.arguments[1].v),
  ];

  // segments declared to be congruent and be part of the line declared to be bisected
  const segmentsEqual =
    s1.getParentSegments().has(bigSeg) && s2.getParentSegments().has(bigSeg);

  // segments must contain midpoint, not be equal
  const segmentCheck =
    s1.contains(midpt) && s2.contains(midpt) && !s1.equals(s2);

  return segmentsEqual && segmentCheck;
};

export const intersect_seg = (
  int_on1: Stmt,
  int_on2: Stmt,
  int_seg: Stmt,
  ctx: ProofContent,
): boolean => {
  if (findDuplicateDependencyStatements([int_on1, int_on2, int_seg])) {
    return false;
  }
  const p1 = ctx.getPoint(int_on1.arguments[1].v);
  const p2 = ctx.getPoint(int_on2.arguments[1].v);

  const [in1, in2, inpt] = [
    ctx.getSegment(int_seg.arguments[0].v),
    ctx.getSegment(int_seg.arguments[1].v),
    ctx.getPoint(int_seg.arguments[2].v),
  ];
  return p1 === p2 && p1.isOnLine(in1) && p1.isOnLine(in2) && p1 === inpt;
};

export const perp = (right: Stmt, perp: Stmt, ctx: ProofContent): boolean => {
  const angle = ctx.getAngle(right.arguments[0].v);
  const [s1, s2] = [
    ctx.getSegment(perp.arguments[0].v),
    ctx.getSegment(perp.arguments[1].v),
  ];
  const intersectPt = ctx.getPoint(perp.arguments[2].v);
  if (!intersectPt) return false;

  // angle vertex must be at the intersection; one ray on each segment
  const startLabel = angle.start.label;
  const endLabel = angle.end.label;
  return (
    angle.centerEquals(intersectPt) &&
    ((s1.label.includes(startLabel) && s2.label.includes(endLabel)) ||
      (s2.label.includes(startLabel) && s1.label.includes(endLabel)))
  );
};

export const perp_con_ang = (perp: Stmt, conAng: Stmt, ctx: ProofContent) => {
  if (findDuplicateDependencyStatements([perp, conAng])) return false;
  const [s1, s2] = [
    ctx.getSegment(perp.arguments[0].v),
    ctx.getSegment(perp.arguments[1].v),
  ];
  const [a1, a2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));
  const intersectPt = ctx.getPoint(perp.arguments[2].v);
  if (!intersectPt) return false;

  if (!a1.centerEquals(intersectPt) || !a2.centerEquals(intersectPt))
    return false;

  const sharedSideTest = a1.sharedSide(a2);
  if (!sharedSideTest) return false;
  const sharedSeg = ctx.getSegment(sharedSideTest.shared);
  if (!sharedSeg || (!sharedSeg.equals(s1) && !sharedSeg.equals(s2)))
    return false;

  return (
    a1.contains(ctx.getPoint(sharedSideTest.thisThird)) &&
    a2.contains(ctx.getPoint(sharedSideTest.otherThird))
  );
};

export const perp_bisector = (
  perp: Stmt,
  midpt: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
) => {
  if (findDuplicateDependencyStatements([perp, conSeg])) return false;
  const intersectPt = ctx.getPoint(perp.arguments[2].v);
  const [m, p] = [
    ctx.getSegment(midpt.arguments[0].v),
    ctx.getPoint(midpt.arguments[1].v),
  ];
  const [s1, s2] = conSeg.arguments.map((arg) => ctx.getSegment(arg.v));

  if (!intersectPt) return false;

  // p must equal the intersection point stated in the perp premise
  if (!p.equals(intersectPt)) return false;

  // m divided by p must give exactly s1 and s2
  const mDivided1 = ctx.getSegment(`${m.p1.label}${p.label}`);
  const mDivided2 = ctx.getSegment(`${m.p2.label}${p.label}`);
  return (
    (s1.equals(mDivided1) && s2.equals(mDivided2)) ||
    (s1.equals(mDivided2) && s2.equals(mDivided1))
  );
};

const transversalHelper = (
  ctx: ProofContent,
  transversal: Stmt,
  conAng: Stmt,
  para: Stmt,
) => {
  let ok = true;
  let [a1, a2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));
  if (a1.equals(a2)) {
    ok = false;
  }
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = transversal.arguments.map(
    (arg) => ctx.getPoint(arg.v),
  );
  const [s1, s2, t, innerT] = [
    ctx.getSegment(`${s1p1.label}${s1p2.label}`),
    ctx.getSegment(`${s2p1.label}${s2p2.label}`),
    ctx.getSegment(`${t1.label}${t2.label}`),
    ctx.getSegment(`${i1.label}${i2.label}`),
  ];
  if (s1.equals(s2) || s1.equals(t) || s2.equals(t)) {
    ok = false;
  }
  let [pa1, pa2] = para.arguments.map((arg) => ctx.getSegment(arg.v));

  if (pa1.equals(s2) && pa2.equals(s1)) {
    // reassign so p1 and p2 correspond to s1 and s2
    [pa1, pa2] = [pa2, pa1];
  }
  if (!pa1.equals(s1) && !pa2.equals(s2)) {
    ok = false;
  }
  // reaassign so that a1 is on s1 and a2 is on s2
  if (a1.centerEquals(i2) && a2.centerEquals(i1)) {
    [a1, a2] = [a2, a1];
  }
  // parallel lines must not be equal, or equal to transversal.
  // intersection pts must be on the parallel lines
  if (
    pa1.equals(pa2) ||
    pa1.equals(t) ||
    pa2.equals(t) ||
    !i1.isOnLine(s1) ||
    !i2.isOnLine(s2)
  ) {
    ok = false;
  }
  return {
    ok,
    pts: [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2],
    segs: [t, innerT],
    angles: [a1, a2],
  };
};
