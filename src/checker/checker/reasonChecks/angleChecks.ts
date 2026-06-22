import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { ParseDiagramStmt, Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import {
  ReasonApplicationResult,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";
import { findDuplicateDependencyStatements } from "./utils";

type DiagramResult =
  | { ok: true; diagramDeps: ParseDiagramStmt[] }
  | { ok: false; failure: { code: string; details?: Record<string, unknown> } };

export const reflex_a = (a1: Angle, a2: Angle): ReasonApplicationResult => {
  if (a1.equals(a2)) return reasonApplicationOk();
  return reasonApplicationFail("REFLEX_A_MISMATCH", {
    ang1: a1.label,
    ang2: a2.label,
  });
};

export const right = (perp: Stmt, right: Stmt, ctx: ProofContent): boolean => {
  const [s1, s2, p] = stmtMapper(perp, ctx) as [Segment, Segment, Point];
  const [r] = stmtMapper(right, ctx) as [Angle];
  if (!p) return false;

  const startLabel = r.start.label;
  const endLabel = r.end.label;
  return (
    r.centerEquals(p) &&
    ((s1.label.includes(startLabel) && s2.label.includes(endLabel)) ||
      (s2.label.includes(startLabel) && s1.label.includes(endLabel)))
  );
};

export const linear_pair = (
  linearPair: Stmt,
  supplementary: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [a1, a2] = stmtMapper(supplementary, ctx) as [Angle, Angle];
  const [l1, l2] = stmtMapper(linearPair, ctx) as [Angle, Angle];

  if (
    (a1.equals(l1) && a2.equals(l2)) ||
    (a1.equals(l2) && a2.equals(l1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("LINEAR_PAIR_MISMATCH");
};

export const con_supp_comp_same_angle = (
  supp: Stmt,
  supp2: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([supp, supp2, conAng]))
    return reasonApplicationFail("CON_SUPP_COMP_SAME_MISMATCH");
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const shared = [a1, a2].find((a) => a.equals(b1) || a.equals(b2));
  if (!shared) return reasonApplicationFail("CON_SUPP_COMP_SAME_MISMATCH");
  if ([a1, a2].filter((a) => a.equals(shared)).length !== 1)
    return reasonApplicationFail("CON_SUPP_COMP_SAME_MISMATCH");
  if ([b1, b2].filter((a) => a.equals(shared)).length !== 1)
    return reasonApplicationFail("CON_SUPP_COMP_SAME_MISMATCH");

  const remaining1 = [a1, a2].find((a) => !a.equals(shared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(shared))!;
  if (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("CON_SUPP_COMP_SAME_MISMATCH");
};

export const con_supp_comp_diff_angles = (
  supp: Stmt,
  supp2: Stmt,
  sharedConAng: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([supp, supp2, conAng]))
    return reasonApplicationFail("CON_SUPP_COMP_DIFF_MISMATCH");
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [s1, s2] = stmtMapper(sharedConAng, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  if (c1.equals(c2) || s1.equals(s2))
    return reasonApplicationFail("CON_SUPP_COMP_DIFF_MISMATCH");

  const s1InSupp = [a1, a2].filter((a) => a.equals(s1)).length === 1;
  const s1InSupp2 = [b1, b2].filter((a) => a.equals(s1)).length === 1;
  const s2InSupp = [a1, a2].filter((a) => a.equals(s2)).length === 1;
  const s2InSupp2 = [b1, b2].filter((a) => a.equals(s2)).length === 1;

  if (s1InSupp === s1InSupp2 || s2InSupp === s2InSupp2)
    return reasonApplicationFail("CON_SUPP_COMP_DIFF_MISMATCH");
  if (s1InSupp === s2InSupp)
    return reasonApplicationFail("CON_SUPP_COMP_DIFF_MISMATCH");

  const [suppShared, supp2Shared] = s1InSupp ? [s1, s2] : [s2, s1];
  const remaining1 = [a1, a2].find((a) => !a.equals(suppShared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(supp2Shared))!;

  if (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("CON_SUPP_COMP_DIFF_MISMATCH");
};

export const vert_ang = (
  intersect_seg: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): boolean => {
  const [s1, s2, pt] = stmtMapper(intersect_seg, ctx) as [Segment, Segment, Point];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const anglesValid =
    !a1.contains(s1) &&
    !a1.contains(s2) &&
    !a2.contains(s1) &&
    !a2.contains(s2) &&
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
  if (matches.length === 0)
    return { ok: false, failure: { code: "VERT_ANG_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const defConRight = (
  right1: Stmt,
  right2: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [a1] = stmtMapper(right1, ctx) as [Angle];
  const [a2] = stmtMapper(right2, ctx) as [Angle];

  if (a1.equals(a2))
    return reasonApplicationFail("DEF_CON_RIGHT_MISMATCH", {
      angle: a1.label,
    });
  return reasonApplicationOk();
};

export const def_ang_bisect = (
  conAng: Stmt,
  bisect: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  const [ang, seg] = stmtMapper(bisect, ctx) as [Angle, Segment];

  if (
    a1.contains(seg) &&
    a2.contains(seg) &&
    a1.centerEquals(a2.center) &&
    a1.centerEquals(ang.center)
  )
    return reasonApplicationOk();
  return reasonApplicationFail("ANG_BISECT_MISMATCH");
};
