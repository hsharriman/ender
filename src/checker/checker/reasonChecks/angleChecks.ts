import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { ParseDiagramStmt, Stmt } from "../../types/checkerTypes";

import {
  CheckerResult,
  diagramFail,
  diagramOk,
  DiagramResult,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";
import {
  resolveAngleForProp,
  resolveSegmentForProp,
  rightAngleOnPerp,
  stmtMapper,
} from "./utils";

const NO_LINEAR_PAIR = "angles_not_linear_pair";
const NO_SHARED_ANG = "no_shared_angle_bw_supp_pairs";
const REMAINDERS_NO_MATCH = "non_shared_angles_dont_match_con_ang_conclusion";
const SAME_SUPP = "con_angles_appear_in_same_supp_pair";
const NOT_DISTRIBUTED = "con_angles_not_distributed_across_pairs";
const NO_VERT_ANG = "no_intersecting_seg_produces_vert_angles";
const BAD_BISECT_ANG = "angle_centers_dont_match";
const BAD_BISECT = "bisector_not_in_both_half_angles";

export const right = (
  perp: Stmt,
  right: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [s1, s2, p] = stmtMapper(perp, ctx) as [Segment, Segment, Point];
  const [r] = stmtMapper(right, ctx) as [Angle];
  return rightAngleOnPerp(r, s1, s2, p, ctx);
};

export const linear_pair = (
  linearPair: Stmt,
  supplementary: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [a1, a2] = stmtMapper(supplementary, ctx) as [Angle, Angle];
  const [l1, l2] = stmtMapper(linearPair, ctx) as [Angle, Angle];

  if ((a1.equals(l1) && a2.equals(l2)) || (a1.equals(l2) && a2.equals(l1)))
    return reasonApplicationOk();
  return reasonApplicationFail(NO_LINEAR_PAIR);
};

export const con_supp_comp_same_angle = (
  supp: Stmt,
  supp2: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const shared = [a1, a2].find((a) => a.equals(b1) || a.equals(b2));
  if (!shared) return reasonApplicationFail(NO_SHARED_ANG);

  const remaining1 = [a1, a2].find((a) => !a.equals(shared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(shared))!;
  if (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail(REMAINDERS_NO_MATCH);
};

export const con_supp_comp_diff_angles = (
  supp: Stmt,
  supp2: Stmt,
  sharedConAng: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [s1, s2] = stmtMapper(sharedConAng, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const s1InSupp = [a1, a2].filter((a) => a.equals(s1)).length === 1;
  const s1InSupp2 = [b1, b2].filter((a) => a.equals(s1)).length === 1;
  const s2InSupp = [a1, a2].filter((a) => a.equals(s2)).length === 1;
  const s2InSupp2 = [b1, b2].filter((a) => a.equals(s2)).length === 1;

  if (s1InSupp === s1InSupp2 || s2InSupp === s2InSupp2)
    return reasonApplicationFail(SAME_SUPP);
  if (s1InSupp === s2InSupp) return reasonApplicationFail(NOT_DISTRIBUTED);

  const [suppShared, supp2Shared] = s1InSupp ? [s1, s2] : [s2, s1];
  const remaining1 = [a1, a2].find((a) => !a.equals(suppShared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(supp2Shared))!;

  if (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail(REMAINDERS_NO_MATCH);
};

export const vert_ang = (
  intersect_seg: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): boolean => {
  const [s1, s2, pt] = stmtMapper(intersect_seg, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  // Check via subsegments: when the intersection is interior (not an endpoint),
  // ang.contains(seg) returns false for the full segment; subsegments fix this.
  const hasRayAlongSeg = (ang: Angle, seg: Segment) =>
    resolveSegmentForProp(seg, (s) => ang.contains(s)) !== null;

  const anglesValid =
    hasRayAlongSeg(a1, s1) &&
    hasRayAlongSeg(a1, s2) &&
    hasRayAlongSeg(a2, s1) &&
    hasRayAlongSeg(a2, s2) &&
    !a1.equals(a2);

  const centerValid = a1.centerEquals(pt) && a2.centerEquals(pt);

  return anglesValid && centerValid;
};

export const check_vert_ang = (
  stmt: Stmt,
  intersects: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = intersects.filter((d) => vert_ang(d.statement, stmt, ctx));
  if (matches.length === 0) return diagramFail(NO_VERT_ANG);
  return diagramOk(matches);
};

export const defConRight = (
  _right1: Stmt,
  _right2: Stmt,
  _ctx: ProofContent,
): CheckerResult => {
  return reasonApplicationOk();
};

export const def_ang_bisect = (
  conAng: Stmt,
  bisect: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  const [ang, seg] = stmtMapper(bisect, ctx) as [Angle, Segment];

  const containsSeg = (a: Angle) => {
    const segSet = new Set(seg.label.split(""));
    return (
      resolveAngleForProp(
        a,
        (n) => (segSet.has(n[0]) || segSet.has(n[2])) && segSet.has(n[1]),
      ) !== null
    );
  };
  if (!a1.centerEquals(a2.center) || !a1.centerEquals(ang.center)) {
    return reasonApplicationFail(BAD_BISECT_ANG);
  }
  if (!containsSeg(a1) || !containsSeg(a2))
    return reasonApplicationFail(BAD_BISECT);
  return reasonApplicationOk();
};
