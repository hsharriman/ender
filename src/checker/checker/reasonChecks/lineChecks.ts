import { Angle, Point, ProofContent, Segment } from "../../../geometry-object";
import { ParseDiagramStmt, Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import {
  ReasonApplicationResult,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";
import { findDuplicateDependencyStatements } from "./utils";

const SEG_NOT_EQUAL = "segs_are_not_equal";
const NO_ALT_INT = "no_transversal_produces_alt_int_angles";
const NO_ALT_EXT = "no_transversal_produces_alt_ext_angles";
const NO_SAMESIDE = "no_transversal_produces_same_side_int_angles";
const NO_CORRESP = "no_transversal_produces_corresp_angles";
const SAME_SEG = "con_segs_are_the_same_seg";
const NO_MIDPT = "segs_not_subsegments_meeting_at_midpt";
const DUPE_STMT = "dupe_stmt_supplied";
const NO_INTERSECT = "points_do_not_share_intersection_on_both_segs";
const NO_PERP_PT = "no_intersect_pt_in_perp_stmt";
const BAD_PERP_ANG = "angle_vertex_not_at_intersection";
const NO_SHARED_CTR = "angles_dont_share_centerpt";
const NO_SHARED_SIDE = "angles_dont_share_side";
const SIDE_NOT_PERP = "shared_side_not_on_perp_segs";
const NOT_ADJ_PERP = "angles_not_adj_at_perp";
const MIDPT_NOT_PERP = "midpt_not_at_perp_intersection";
const BAD_BISECT = "bisected_halves_dont_match_con_segs";
const TRANSVERSAL_BAD = "transversal_segs_dont_form_valid_config";
const ALT_INT_CTR = "alt_int_angle_ctrs_not_at_inner_intersections";
const ALT_INT_INWARD = "alt_int_angles_not_directed_inward";
const ALT_INT_SIDES = "alt_int_angles_not_on_alternating_sides";
const ALT_EXT_ENDPT = "alt_ext_transversal_endpt_at_intersection";
const ALT_EXT_LINE = "alt_ext_intersections_not_on_transversal_line";
const ALT_EXT_OUTER = "alt_ext_angle_ctrs_or_rays_not_at_outer_pts";
const ALT_EXT_SIDES = "alt_ext_angles_not_on_alternating_sides";
const SS_CTR = "same_side_angle_ctrs_not_at_intersections";
const SS_INWARD = "same_side_angles_not_directed_inward";
const SS_SIDE = "same_side_angles_not_on_same_side";
const CORRESP_ENDPT = "corresp_transversal_endpt_at_intersection";
const CORRESP_LINE = "corresp_intersections_not_on_transversal_line";
const CORRESP_CTR = "corresp_angle_ctrs_not_at_intersections";
const CORRESP_DIR = "corresp_angles_not_in_corresponding_directions";
const CORRESP_SIDE = "corresp_angles_not_on_same_side";

type DiagramResult =
  | { ok: true; diagramDeps: ParseDiagramStmt[] }
  | { ok: false; failure: { code: string; details?: Record<string, unknown> } };

export const reflex_s = (s1: Segment, s2: Segment): ReasonApplicationResult => {
  if (s1.equals(s2)) return reasonApplicationOk();
  return reasonApplicationFail(SEG_NOT_EQUAL, {
    seg1: s1.label,
    seg2: s2.label,
  });
};

export const altint = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): DiagramResult => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return { ok: false, failure: { code: TRANSVERSAL_BAD } };

  const [s1p1, s1p2, , , s2p1, s2p2] = res.pts;
  const [, innerT] = res.segs;
  const [a1, a2] = res.angles;

  if (!a1.centerEquals(innerT.p1) || !a2.centerEquals(innerT.p2))
    return { ok: false, failure: { code: ALT_INT_CTR } };

  if (!a1.contains(innerT.p2) || !a2.contains(innerT.p1))
    return { ok: false, failure: { code: ALT_INT_INWARD } };

  if (
    (a1.contains(s1p1) && a2.contains(s2p2)) ||
    (a1.contains(s1p2) && a2.contains(s2p1))
  )
    return { ok: true, diagramDeps: [] };

  return { ok: false, failure: { code: ALT_INT_SIDES } };
};

export const check_altint = (
  conAng: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches: ParseDiagramStmt[] = [];
  let lastFailure: DiagramResult = { ok: false, failure: { code: NO_ALT_INT } };
  for (const d of transversals) {
    const r = altint(conAng, d.statement, para, ctx);
    if (r.ok) matches.push(d);
    else lastFailure = r;
  }
  return matches.length > 0 ? { ok: true, diagramDeps: matches } : lastFailure;
};

export const altext = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): DiagramResult => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return { ok: false, failure: { code: TRANSVERSAL_BAD } };

  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = res.pts;
  const [t] = res.segs;
  const [a1, a2] = res.angles;

  if (t1.equals(i1) || t2.equals(i2))
    return { ok: false, failure: { code: ALT_EXT_ENDPT } };

  if (!i1.isOnLine(t) || !i2.isOnLine(t))
    return { ok: false, failure: { code: ALT_EXT_LINE } };

  if (
    !a1.centerEquals(i1) ||
    !a2.centerEquals(i2) ||
    !a1.contains(t1) ||
    !a2.contains(t2)
  )
    return { ok: false, failure: { code: ALT_EXT_OUTER } };

  if (
    (a1.contains(s1p1) && a2.contains(s2p2)) ||
    (a1.contains(s1p2) && a2.contains(s2p1))
  )
    return { ok: true, diagramDeps: [] };

  return { ok: false, failure: { code: ALT_EXT_SIDES } };
};

export const check_altext = (
  conAng: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches: ParseDiagramStmt[] = [];
  let lastFailure: DiagramResult = { ok: false, failure: { code: NO_ALT_EXT } };
  for (const d of transversals) {
    const r = altext(conAng, d.statement, para, ctx);
    if (r.ok) matches.push(d);
    else lastFailure = r;
  }
  return matches.length > 0 ? { ok: true, diagramDeps: matches } : lastFailure;
};

export const sameside = (
  supplementary: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): DiagramResult => {
  const res = transversalHelper(ctx, transversal, supplementary, para);
  if (!res.ok) return { ok: false, failure: { code: TRANSVERSAL_BAD } };

  const [s1p1, s1p2, , i1, s2p1, s2p2, , i2] = res.pts;
  const [a1, a2] = res.angles;

  if (!a1.centerEquals(i1) || !a2.centerEquals(i2))
    return { ok: false, failure: { code: SS_CTR } };

  if (!a1.contains(i2) || !a2.contains(i1))
    return { ok: false, failure: { code: SS_INWARD } };

  if (
    (a1.contains(s1p1) && a2.contains(s2p1)) ||
    (a1.contains(s1p2) && a2.contains(s2p2))
  )
    return { ok: true, diagramDeps: [] };

  return { ok: false, failure: { code: SS_SIDE } };
};

export const check_sameside = (
  supAng: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches: ParseDiagramStmt[] = [];
  let lastFailure: DiagramResult = { ok: false, failure: { code: NO_SAMESIDE } };
  for (const d of transversals) {
    const r = sameside(supAng, d.statement, para, ctx);
    if (r.ok) matches.push(d);
    else lastFailure = r;
  }
  return matches.length > 0 ? { ok: true, diagramDeps: matches } : lastFailure;
};

export const corresp_ang = (
  conAng: Stmt,
  transversal: Stmt,
  para: Stmt,
  ctx: ProofContent,
): DiagramResult => {
  const res = transversalHelper(ctx, transversal, conAng, para);
  if (!res.ok) return { ok: false, failure: { code: TRANSVERSAL_BAD } };

  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = res.pts;
  const [t] = res.segs;
  const [a1, a2] = res.angles;

  if (t1.equals(i1) || t2.equals(i2))
    return { ok: false, failure: { code: CORRESP_ENDPT } };

  if (!i1.isOnLine(t) || !i2.isOnLine(t))
    return { ok: false, failure: { code: CORRESP_LINE } };

  if (!a1.centerEquals(i1) || !a2.centerEquals(i2))
    return { ok: false, failure: { code: CORRESP_CTR } };

  if (
    !((a1.contains(i2) && a2.contains(t2)) ||
      (a2.contains(i1) && a1.contains(t1)))
  )
    return { ok: false, failure: { code: CORRESP_DIR } };

  if (
    (a1.contains(s1p1) && a2.contains(s2p1)) ||
    (a1.contains(s1p2) && a2.contains(s2p2))
  )
    return { ok: true, diagramDeps: [] };

  return { ok: false, failure: { code: CORRESP_SIDE } };
};

export const check_corresp_ang = (
  conAng: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches: ParseDiagramStmt[] = [];
  let lastFailure: DiagramResult = { ok: false, failure: { code: NO_CORRESP } };
  for (const d of transversals) {
    const r = corresp_ang(conAng, d.statement, para, ctx);
    if (r.ok) matches.push(d);
    else lastFailure = r;
  }
  return matches.length > 0 ? { ok: true, diagramDeps: matches } : lastFailure;
};

export const midpt = (
  conSeg: Stmt,
  midPt: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];
  if (s1.equals(s2)) return reasonApplicationFail(SAME_SEG);
  const [bigSeg, midPtObj] = stmtMapper(midPt, ctx) as [Segment, Point];

  const segmentsEqual =
    s1.getParentSegments().has(bigSeg) && s2.getParentSegments().has(bigSeg);
  const segmentCheck =
    s1.contains(midPtObj) && s2.contains(midPtObj) && !s1.equals(s2);

  if (segmentsEqual && segmentCheck) return reasonApplicationOk();
  return reasonApplicationFail(NO_MIDPT);
};

export const intersect_seg = (
  int_on1: Stmt,
  int_on2: Stmt,
  int_seg: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([int_on1, int_on2, int_seg])) {
    return reasonApplicationFail(DUPE_STMT);
  }
  const [, p1] = stmtMapper(int_on1, ctx) as [Segment, Point];
  const [, p2] = stmtMapper(int_on2, ctx) as [Segment, Point];
  const [in1, in2, inpt] = stmtMapper(int_seg, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  if (p1 === p2 && p1.isOnLine(in1) && p1.isOnLine(in2) && p1 === inpt)
    return reasonApplicationOk();
  return reasonApplicationFail(NO_INTERSECT);
};

export const perp = (
  rightStmt: Stmt,
  perpStmt: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [angle] = stmtMapper(rightStmt, ctx) as [Angle];
  const [s1, s2, intersectPt] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  if (!intersectPt) return reasonApplicationFail(NO_PERP_PT);
  const startLabel = angle.start.label;
  const endLabel = angle.end.label;
  if (
    angle.centerEquals(intersectPt) &&
    ((s1.label.includes(startLabel) && s2.label.includes(endLabel)) ||
      (s2.label.includes(startLabel) && s1.label.includes(endLabel)))
  )
    return reasonApplicationOk();
  return reasonApplicationFail(BAD_PERP_ANG);
};

export const perp_con_ang = (
  perpStmt: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([perpStmt, conAng]))
    return reasonApplicationFail(DUPE_STMT);
  const [s1, s2, intersectPt] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  if (!intersectPt) return reasonApplicationFail(NO_PERP_PT);

  if (!a1.centerEquals(intersectPt) || !a2.centerEquals(intersectPt))
    return reasonApplicationFail(NO_SHARED_CTR);

  const sharedSideTest = a1.sharedSide(a2);
  if (!sharedSideTest) return reasonApplicationFail(NO_SHARED_SIDE);
  const sharedSeg = ctx.getSegment(sharedSideTest.shared);
  if (!sharedSeg || (!sharedSeg.equals(s1) && !sharedSeg.equals(s2)))
    return reasonApplicationFail(SIDE_NOT_PERP);

  if (
    a1.contains(ctx.getPoint(sharedSideTest.thisThird)) &&
    a2.contains(ctx.getPoint(sharedSideTest.otherThird))
  )
    return reasonApplicationOk();
  return reasonApplicationFail(NOT_ADJ_PERP);
};

export const perp_bisector = (
  perpStmt: Stmt,
  midptStmt: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([perpStmt, conSeg]))
    return reasonApplicationFail(DUPE_STMT);
  const [, , intersectPt] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [m, p] = stmtMapper(midptStmt, ctx) as [Segment, Point];
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  if (!intersectPt) return reasonApplicationFail(NO_PERP_PT);
  if (!p.equals(intersectPt)) return reasonApplicationFail(MIDPT_NOT_PERP);

  const mDivided1 = ctx.getSegment(`${m.p1.label}${p.label}`);
  const mDivided2 = ctx.getSegment(`${m.p2.label}${p.label}`);
  if (
    (s1.equals(mDivided1) && s2.equals(mDivided2)) ||
    (s1.equals(mDivided2) && s2.equals(mDivided1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail(BAD_BISECT);
};

const transversalHelper = (
  ctx: ProofContent,
  transversal: Stmt,
  conAng: Stmt,
  para: Stmt,
) => {
  let ok = true;
  let [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  if (a1.equals(a2)) {
    ok = false;
  }
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = stmtMapper(
    transversal,
    ctx,
  ) as Point[];
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
    [pa1, pa2] = [pa2, pa1];
  }
  if (!pa1.equals(s1) && !pa2.equals(s2)) {
    ok = false;
  }
  if (a1.centerEquals(i2) && a2.centerEquals(i1)) {
    [a1, a2] = [a2, a1];
  }
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
