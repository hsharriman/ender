import { Angle, Point, ProofContent, Segment } from "../../../geometry-object";
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

export const reflex_s = (s1: Segment, s2: Segment): ReasonApplicationResult => {
  if (s1.equals(s2)) return reasonApplicationOk();
  return reasonApplicationFail("REFLEX_S_MISMATCH", {
    seg1: s1.label,
    seg2: s2.label,
  });
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

  if (a1.centerEquals(innerT.p1) && a2.centerEquals(innerT.p2)) {
    if (a1.contains(innerT.p2) && a2.contains(innerT.p1)) {
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

export const check_altint = (
  stmt: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    altint(stmt, d.statement, para, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "ALTINT_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const check_altint_conv = (
  conAng: Stmt,
  stmt: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    altint(conAng, d.statement, stmt, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "ALTINT_CONV_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
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

  if (t1.equals(i1) || t2.equals(i2)) {
    return false;
  }

  const segmentCheck = i1.isOnLine(t) && i2.isOnLine(t);

  let angleCheck = false;
  if (a1.centerEquals(i1) && a2.centerEquals(i2)) {
    if (a1.contains(t1) && a2.contains(t2)) {
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

export const check_altext = (
  stmt: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    altext(stmt, d.statement, para, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "ALTEXT_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const check_altext_conv = (
  conAng: Stmt,
  stmt: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    altext(conAng, d.statement, stmt, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "ALTEXT_CONV_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
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

  if (a1.centerEquals(i1) && a2.centerEquals(i2)) {
    if (a1.contains(i2) && a2.contains(i1)) {
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

export const check_sameside = (
  stmt: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    sameside(stmt, d.statement, para, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "SAMESIDE_ANG_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const check_sameside_conv = (
  supAng: Stmt,
  stmt: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    sameside(supAng, d.statement, stmt, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "SAMESIDE_ANG_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

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

  if (t1.equals(i1) || t2.equals(i2)) {
    return false;
  }

  const segmentCheck = i1.isOnLine(t) && i2.isOnLine(t);

  let angleCheck = a1.centerEquals(i1) && a2.centerEquals(i2);

  if (
    (a1.contains(i2) && a2.contains(t2)) ||
    (a2.contains(i1) && a1.contains(t1))
  ) {
    if (
      (a1.contains(s1p1) && a2.contains(s2p1)) ||
      (a1.contains(s1p2) && a2.contains(s2p2))
    ) {
      angleCheck = true;
    }
  }
  return segmentCheck && angleCheck;
};

export const check_corresp_ang = (
  stmt: Stmt,
  para: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    corresp_ang(stmt, d.statement, para, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "CORRESP_ANG_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const check_corresp_ang_conv = (
  conAng: Stmt,
  stmt: Stmt,
  transversals: ParseDiagramStmt[],
  ctx: ProofContent,
): DiagramResult => {
  const matches = transversals.filter((d) =>
    corresp_ang(conAng, d.statement, stmt, ctx),
  );
  if (matches.length === 0)
    return { ok: false, failure: { code: "CORRESP_ANG_CONV_NO_MATCH" } };
  return { ok: true, diagramDeps: matches };
};

export const midpt = (
  conSeg: Stmt,
  midPt: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];
  if (s1.equals(s2)) return reasonApplicationFail("MIDPT_MISMATCH");
  const [bigSeg, midPtObj] = stmtMapper(midPt, ctx) as [Segment, Point];

  const segmentsEqual =
    s1.getParentSegments().has(bigSeg) && s2.getParentSegments().has(bigSeg);
  const segmentCheck =
    s1.contains(midPtObj) && s2.contains(midPtObj) && !s1.equals(s2);

  if (segmentsEqual && segmentCheck) return reasonApplicationOk();
  return reasonApplicationFail("MIDPT_MISMATCH");
};

export const intersect_seg = (
  int_on1: Stmt,
  int_on2: Stmt,
  int_seg: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([int_on1, int_on2, int_seg])) {
    return reasonApplicationFail("INTERSECT_SEG_MISMATCH");
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
  return reasonApplicationFail("INTERSECT_SEG_MISMATCH");
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
  if (!intersectPt) return reasonApplicationFail("PERP_NO_MATCH");
  const startLabel = angle.start.label;
  const endLabel = angle.end.label;
  if (
    angle.centerEquals(intersectPt) &&
    ((s1.label.includes(startLabel) && s2.label.includes(endLabel)) ||
      (s2.label.includes(startLabel) && s1.label.includes(endLabel)))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("PERP_NO_MATCH");
};

export const perp_con_ang = (
  perpStmt: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([perpStmt, conAng]))
    return reasonApplicationFail("PERP_CON_ANG_MISMATCH");
  const [s1, s2, intersectPt] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  if (!intersectPt) return reasonApplicationFail("PERP_CON_ANG_MISMATCH");

  if (!a1.centerEquals(intersectPt) || !a2.centerEquals(intersectPt))
    return reasonApplicationFail("PERP_CON_ANG_MISMATCH");

  const sharedSideTest = a1.sharedSide(a2);
  if (!sharedSideTest)
    return reasonApplicationFail("PERP_CON_ANG_MISMATCH");
  const sharedSeg = ctx.getSegment(sharedSideTest.shared);
  if (!sharedSeg || (!sharedSeg.equals(s1) && !sharedSeg.equals(s2)))
    return reasonApplicationFail("PERP_CON_ANG_MISMATCH");

  if (
    a1.contains(ctx.getPoint(sharedSideTest.thisThird)) &&
    a2.contains(ctx.getPoint(sharedSideTest.otherThird))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("PERP_CON_ANG_MISMATCH");
};

export const perp_bisector = (
  perpStmt: Stmt,
  midptStmt: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (findDuplicateDependencyStatements([perpStmt, conSeg]))
    return reasonApplicationFail("PERP_BISECTOR_MISMATCH");
  const [, , intersectPt] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [m, p] = stmtMapper(midptStmt, ctx) as [Segment, Point];
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  if (!intersectPt) return reasonApplicationFail("PERP_BISECTOR_MISMATCH");
  if (!p.equals(intersectPt))
    return reasonApplicationFail("PERP_BISECTOR_MISMATCH");

  const mDivided1 = ctx.getSegment(`${m.p1.label}${p.label}`);
  const mDivided2 = ctx.getSegment(`${m.p2.label}${p.label}`);
  if (
    (s1.equals(mDivided1) && s2.equals(mDivided2)) ||
    (s1.equals(mDivided2) && s2.equals(mDivided1))
  )
    return reasonApplicationOk();
  return reasonApplicationFail("PERP_BISECTOR_MISMATCH");
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
  const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] = stmtMapper(transversal, ctx) as Point[];
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
