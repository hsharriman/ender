import { Obj, ParseObj, ProofContent } from "geometry-object";
import { ParseDiagramStmt, Stmt } from "../../types/checkerTypes";
import { canonicalKey, canonicalObjLabel } from "./canonical";
import { FactIndex } from "./factIndex";

/**
 * Backward dependency generators: given a reason and a concrete conclusion
 * statement, enumerate the (few) plausible dependency-statement tuples that
 * could justify it. Each emitted tuple is later resolved against the fact
 * index (already-proven statements) or recursed on as subgoals, and every
 * assembled candidate is confirmed by `checkReasonApplication` — generators
 * only control how many candidates get checked, never correctness.
 *
 * Four families cover most reasons:
 *  - object assembly (sas/sss/asa/aas/rhl/def_con_tri/aa_sim): conclusion
 *    triangle labels fix the vertex correspondence, which fixes the part pairs
 *  - part extraction (cpctc): conclusion parts point at the source objects
 *  - diagram-driven (vert_ang + transversal family): candidates come from the
 *    diagram premises, not from enumerating all angle pairs in ctx
 *  - transitive/join (con_*_transitive, con_supplements*): join two facts on a
 *    shared object via the fact index
 * Reasons without a bespoke generator fall back to fact-index enumeration in
 * `fillDeps.ts`.
 */

export interface DepCandidate {
  /** Concrete dependency statements in the reason's slot order. */
  deps: Stmt[];
}

export interface GeneratorInput {
  conclusion: Stmt;
  ctx: ProofContent;
  facts: FactIndex;
  diagrams: ParseDiagramStmt[];
}

type Generator = (input: GeneratorInput) => DepCandidate[];

const seg = (v: string): ParseObj => ({ type: Obj.Segment, v });
const ang = (v: string): ParseObj => ({ type: Obj.Angle, v });
const tri = (v: string): ParseObj => ({ type: Obj.Triangle, v });
const pt = (v: string): ParseObj => ({ type: Obj.Point, v });

const mkStmt = (fn: string, args: ParseObj[]): Stmt => ({
  function: fn,
  arguments: args,
});

/**
 * Congruence pair over segments/angles, choosing the reflexive statement when
 * both labels resolve to the same ctx object (a shared side/angle), since
 * `con_*` statements reject duplicate arguments.
 */
const congSegPair = (v1: string, v2: string, ctx: ProofContent): Stmt | null => {
  const o1 = ctx.getSegment(v1);
  const o2 = ctx.getSegment(v2);
  if (!o1 || !o2) return null;
  // Reflexive pairs must repeat one spelling: shared-side checks compare the
  // argument labels verbatim (ref_seg(LU, UL) would fail where ref_seg(LU, LU)
  // passes).
  if (o1 === o2) return mkStmt("ref_seg", [seg(o1.label), seg(o1.label)]);
  return mkStmt("con_seg", [seg(v1), seg(v2)]);
};

const congAngPair = (v1: string, v2: string, ctx: ProofContent): Stmt | null => {
  const o1 = ctx.getAngle(v1);
  const o2 = ctx.getAngle(v2);
  if (!o1 || !o2) return null;
  if (o1 === o2) return mkStmt("ref_ang", [ang(o1.label), ang(o1.label)]);
  return mkStmt("con_ang", [ang(v1), ang(v2)]);
};

const rightAngPair = (v1: string, v2: string, ctx: ProofContent): Stmt | null => {
  const o1 = ctx.getAngle(v1);
  const o2 = ctx.getAngle(v2);
  if (!o1 || !o2 || o1 === o2) return null;
  return mkStmt("con_right", [ang(v1), ang(v2)]);
};

const dedupeCandidates = (
  candidates: DepCandidate[],
  ctx: ProofContent,
): DepCandidate[] => {
  const seen = new Set<string>();
  const out: DepCandidate[] = [];
  for (const c of candidates) {
    const key = c.deps.map((d) => canonicalKey(d, ctx)).join("&");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
};

const compact = (deps: Array<Stmt | null>): Stmt[] | null => {
  const out: Stmt[] = [];
  for (const d of deps) {
    if (!d) return null;
    out.push(d);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Object assembly: triangle congruence / similarity
// ---------------------------------------------------------------------------

/** Indices of the two vertices other than k. */
const others = (k: number): [number, number] =>
  k === 0 ? [1, 2] : k === 1 ? [0, 2] : [0, 1];

/** All permutations of [0,1,2], identity first. */
const VERTEX_PERMS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

/**
 * The conclusion `con_tri(T1, T2)` does not pin down which vertices
 * correspond — the checker assigns parts by containment and reorders the
 * triangles afterwards (`orderTri`). Enumerate every vertex correspondence
 * (label-consistent one first) and emit the part pairs it induces; wrong
 * correspondences are cheap to reject at verification.
 */
const triCongGen =
  (kind: "sas" | "sss" | "asa" | "aas" | "rhl" | "def_con_tri" | "aa_sim"): Generator =>
  ({ conclusion, ctx }) => {
    if (conclusion.arguments.length !== 2) return [];
    const [v1, v2raw] = conclusion.arguments.map((a) => a.v);
    if (v1.length !== 3 || v2raw.length !== 3) return [];

    const candidates: DepCandidate[] = [];
    for (const perm of VERTEX_PERMS) {
      const v2 = `${v2raw[perm[0]]}${v2raw[perm[1]]}${v2raw[perm[2]]}`;
      emitForCorrespondence(kind, v1, v2, ctx, candidates);
    }
    return dedupeCandidates(candidates, ctx);
  };

const emitForCorrespondence = (
  kind: "sas" | "sss" | "asa" | "aas" | "rhl" | "def_con_tri" | "aa_sim",
  v1: string,
  v2: string,
  ctx: ProofContent,
  candidates: DepCandidate[],
): void => {
    const sideAt = (i: number, j: number) =>
      congSegPair(`${v1[i]}${v1[j]}`, `${v2[i]}${v2[j]}`, ctx);
    const angleAt = (k: number) => {
      const [i, j] = others(k);
      return congAngPair(
        `${v1[i]}${v1[k]}${v1[j]}`,
        `${v2[i]}${v2[k]}${v2[j]}`,
        ctx,
      );
    };
    const rightAt = (k: number) => {
      const [i, j] = others(k);
      return rightAngPair(
        `${v1[i]}${v1[k]}${v1[j]}`,
        `${v2[i]}${v2[k]}${v2[j]}`,
        ctx,
      );
    };

    const push = (deps: Array<Stmt | null>) => {
      const full = compact(deps);
      if (full) candidates.push({ deps: full });
    };

    switch (kind) {
      case "sas":
        // Included angle at vertex k, flanked by the two sides at k.
        for (let k = 0; k < 3; k++) {
          const [i, j] = others(k);
          push([sideAt(k, i), angleAt(k), sideAt(k, j)]);
        }
        break;
      case "sss":
        push([sideAt(0, 1), sideAt(0, 2), sideAt(1, 2)]);
        break;
      case "asa":
        // Included side between the angles at its two endpoints.
        for (let k = 0; k < 3; k++) {
          const [i, j] = others(k);
          push([angleAt(i), sideAt(i, j), angleAt(j)]);
        }
        break;
      case "aas":
        // Two angles plus a side adjacent to exactly one of them.
        for (let k = 0; k < 3; k++) {
          const [i, j] = others(k);
          push([angleAt(i), sideAt(i, j), angleAt(j)]); // also covers ASA shape
          push([angleAt(i), angleAt(j), sideAt(i, k)]);
          push([angleAt(i), angleAt(j), sideAt(j, k)]);
        }
        break;
      case "rhl":
        // Right angle at k, hypotenuse opposite k, leg touching k.
        for (let k = 0; k < 3; k++) {
          const [i, j] = others(k);
          push([rightAt(k), sideAt(i, j), sideAt(k, i)]);
          push([rightAt(k), sideAt(i, j), sideAt(k, j)]);
        }
        break;
      case "def_con_tri":
        push([
          sideAt(0, 1),
          sideAt(0, 2),
          sideAt(1, 2),
          angleAt(0),
          angleAt(1),
          angleAt(2),
        ]);
        break;
      case "aa_sim":
        for (let k = 0; k < 3; k++) {
          const [i, j] = others(k);
          push([angleAt(i), angleAt(j)]);
        }
        break;
    }
};

// ---------------------------------------------------------------------------
// Part extraction: cpctc
// ---------------------------------------------------------------------------

const cpctcGen: Generator = ({ conclusion, ctx, facts }) => {
  const candidates: DepCandidate[] = [];
  // Any already-known triangle congruence is a candidate source.
  for (const f of facts.byFunction(["con_tri"])) {
    candidates.push({ deps: [f.stmt] });
  }
  // Synthesized: any ctx triangle pair holding the two conclusion parts.
  // Membership resolves through the ctx object (its names carry overlap
  // variants like CAB≡CAM that the triangle's own part instances lack).
  const resolvePart = (arg: ParseObj) =>
    arg.type === Obj.Segment
      ? ctx.getSegment(arg.v)
      : arg.type === Obj.Angle
        ? ctx.getAngle(arg.v)
        : undefined;
  const [xArg, yArg] = conclusion.arguments;
  const x = xArg ? resolvePart(xArg) : undefined;
  const y = yArg ? resolvePart(yArg) : undefined;
  if (x && y) {
    const triangles = ctx.getTriangles();
    for (const t1 of triangles) {
      for (const t2 of triangles) {
        if (t1 === t2) continue;
        if (t1.contains(x) && t2.contains(y)) {
          candidates.push({
            deps: [mkStmt("con_tri", [tri(t1.label), tri(t2.label)])],
          });
        }
      }
    }
  }
  return dedupeCandidates(candidates, ctx);
};

// ---------------------------------------------------------------------------
// Diagram-driven: vertical angles and the transversal family
// ---------------------------------------------------------------------------

interface TransversalInfo {
  s1p1: string;
  s1p2: string;
  t1: string;
  i1: string;
  s2p1: string;
  s2p2: string;
  t2: string;
  i2: string;
  s1: string;
  s2: string;
}

const transversalInfos = (diagrams: ParseDiagramStmt[]): TransversalInfo[] =>
  diagrams
    .filter((d) => d.statement.function === "transversal")
    .map((d) => {
      const [s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2] =
        d.statement.arguments.map((a) => a.v);
      return {
        s1p1,
        s1p2,
        t1,
        i1,
        s2p1,
        s2p2,
        t2,
        i2,
        s1: `${s1p1}${s1p2}`,
        s2: `${s2p1}${s2p2}`,
      };
    });

/** Do the conclusion's two angle centers sit at the two intersections? */
const centersMatch = (
  conclusion: Stmt,
  i1: string,
  i2: string,
  ctx: ProofContent,
): boolean => {
  if (conclusion.arguments.length !== 2) return false;
  const [a1, a2] = conclusion.arguments.map((a) => ctx.getAngle(a.v));
  if (!a1 || !a2) return false;
  const centers = new Set([a1.center.label, a2.center.label]);
  return centers.has(i1) && centers.has(i2);
};

/** Does the conclusion `para(x,y)` reference the transversal's crossed lines? */
const paraMatchesTransversal = (
  conclusion: Stmt,
  t: TransversalInfo,
  ctx: ProofContent,
): boolean => {
  if (conclusion.arguments.length !== 2) return false;
  const [x, y] = conclusion.arguments.map((a) => ctx.getSegment(a.v));
  const s1 = ctx.getSegment(t.s1);
  const s2 = ctx.getSegment(t.s2);
  if (!x || !y || !s1 || !s2) return false;
  return (x === s1 && y === s2) || (x === s2 && y === s1);
};

/**
 * Forward transversal reasons (dep `para` → angle-relation conclusion). The
 * argument order of the emitted `para` follows the transversal's stated
 * direction (s1p1→s1p2 ∥ s2p1→s2p2), the checker's convention.
 */
const transversalParaDepGen: Generator = ({ conclusion, ctx, diagrams }) => {
  const candidates: DepCandidate[] = [];
  for (const t of transversalInfos(diagrams)) {
    if (!centersMatch(conclusion, t.i1, t.i2, ctx)) continue;
    if (!ctx.getSegment(t.s1) || !ctx.getSegment(t.s2)) continue;
    candidates.push({ deps: [mkStmt("para", [seg(t.s1), seg(t.s2)])] });
  }
  return dedupeCandidates(candidates, ctx);
};

/** Converse transversal reasons (angle-relation dep → conclusion `para`). */
const transversalConvGen =
  (
    kind: "altint" | "altext" | "corresp" | "sameside",
    depFn: "con_ang" | "supplementary",
  ): Generator =>
  ({ conclusion, ctx, diagrams }) => {
    const candidates: DepCandidate[] = [];
    for (const t of transversalInfos(diagrams)) {
      if (!paraMatchesTransversal(conclusion, t, ctx)) continue;
      const pairs: Array<[string, string]> = [];
      const { s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2 } = t;
      switch (kind) {
        case "altint":
          pairs.push([`${s1p1}${i1}${i2}`, `${s2p2}${i2}${i1}`]);
          pairs.push([`${s1p2}${i1}${i2}`, `${s2p1}${i2}${i1}`]);
          break;
        case "altext":
          pairs.push([`${s1p1}${i1}${t1}`, `${s2p2}${i2}${t2}`]);
          pairs.push([`${s1p2}${i1}${t1}`, `${s2p1}${i2}${t2}`]);
          break;
        case "corresp":
          pairs.push([`${s1p1}${i1}${i2}`, `${s2p1}${i2}${t2}`]);
          pairs.push([`${s1p2}${i1}${i2}`, `${s2p2}${i2}${t2}`]);
          pairs.push([`${s1p1}${i1}${t1}`, `${s2p1}${i2}${i1}`]);
          pairs.push([`${s1p2}${i1}${t1}`, `${s2p2}${i2}${i1}`]);
          break;
        case "sameside":
          pairs.push([`${s1p1}${i1}${i2}`, `${s2p1}${i2}${i1}`]);
          pairs.push([`${s1p2}${i1}${i2}`, `${s2p2}${i2}${i1}`]);
          break;
      }
      for (const [x, y] of pairs) {
        const o1 = ctx.getAngle(x);
        const o2 = ctx.getAngle(y);
        if (!o1 || !o2 || o1 === o2) continue;
        candidates.push({ deps: [mkStmt(depFn, [ang(x), ang(y)])] });
      }
    }
    return dedupeCandidates(candidates, ctx);
  };

const vertAngGen: Generator = ({ conclusion, ctx, diagrams }) => {
  if (conclusion.arguments.length !== 2) return [];
  const [a1, a2] = conclusion.arguments.map((a) => ctx.getAngle(a.v));
  if (!a1 || !a2 || a1 === a2) return [];
  const plausible = diagrams.some((d) => {
    if (d.statement.function !== "intersect_seg") return false;
    const p = d.statement.arguments[2]?.v;
    return p !== undefined && a1.center.label === p && a2.center.label === p;
  });
  return plausible ? [{ deps: [] }] : [];
};

const reflexGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.arguments.length !== 2) return [];
  const [x, y] = conclusion.arguments;
  if (conclusion.function === "ref_seg") {
    const o1 = ctx.getSegment(x.v);
    const o2 = ctx.getSegment(y.v);
    return o1 && o1 === o2 ? [{ deps: [] }] : [];
  }
  if (conclusion.function === "ref_ang") {
    const o1 = ctx.getAngle(x.v);
    const o2 = ctx.getAngle(y.v);
    return o1 && o1 === o2 ? [{ deps: [] }] : [];
  }
  return [];
};

// ---------------------------------------------------------------------------
// Transitive / join reasons
// ---------------------------------------------------------------------------

/**
 * `R(a,b)` from `R(a,x) + R(x,b)`: join over facts mentioning `a` or `b`.
 * Only middles already present in the fact index are proposed; the missing
 * half becomes a subgoal.
 */
const transitiveGen =
  (fn: string): Generator =>
  ({ conclusion, ctx, facts }) => {
    if (conclusion.arguments.length !== 2) return [];
    const [a, b] = conclusion.arguments;
    const canonical = (o: ParseObj) => `${o.type}:${canonicalObjLabel(o, ctx)}`;
    const aKey = canonical(a);
    const bKey = canonical(b);
    const candidates: DepCandidate[] = [];
    const partnerOf = (stmt: Stmt, objKey: string): ParseObj | undefined => {
      const [p, q] = stmt.arguments;
      if (canonical(p) === objKey) return q;
      if (canonical(q) === objKey) return p;
      return undefined;
    };
    for (const f of facts.byFunction([fn])) {
      const viaA = partnerOf(f.stmt, aKey);
      if (viaA && canonical(viaA) !== bKey) {
        candidates.push({ deps: [f.stmt, mkStmt(fn, [viaA, b])] });
      }
      const viaB = partnerOf(f.stmt, bKey);
      if (viaB && canonical(viaB) !== aKey) {
        candidates.push({ deps: [mkStmt(fn, [a, viaB]), f.stmt] });
      }
    }
    return dedupeCandidates(candidates, ctx);
  };

/** `con_ang(a,b)` from supplements/complements of the same known angle. */
const conSameGen =
  (depFn: "supplementary" | "complementary"): Generator =>
  ({ conclusion, ctx, facts }) => {
    if (conclusion.arguments.length !== 2) return [];
    const [a, b] = conclusion.arguments;
    const canonical = (o: ParseObj) => `${o.type}:${canonicalObjLabel(o, ctx)}`;
    const aKey = canonical(a);
    const bKey = canonical(b);
    const candidates: DepCandidate[] = [];
    for (const f of facts.byFunction([depFn])) {
      const [p, q] = f.stmt.arguments;
      const middleForA =
        canonical(p) === aKey ? q : canonical(q) === aKey ? p : undefined;
      if (middleForA) {
        candidates.push({
          deps: [f.stmt, mkStmt(depFn, [b, middleForA])],
        });
      }
      const middleForB =
        canonical(p) === bKey ? q : canonical(q) === bKey ? p : undefined;
      if (middleForB) {
        candidates.push({
          deps: [mkStmt(depFn, [a, middleForB]), f.stmt],
        });
      }
    }
    return dedupeCandidates(candidates, ctx);
  };

// ---------------------------------------------------------------------------
// Assorted single-shape generators
// ---------------------------------------------------------------------------

const commonLetter = (x: string, y: string): string | undefined => {
  for (const c of x) if (y.includes(c)) return c;
  return undefined;
};

const defMidptGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "con_seg") return [];
  const [x, y] = conclusion.arguments.map((a) => a.v);
  if (x.length !== 2 || y.length !== 2) return [];
  const p = commonLetter(x, y);
  if (!p) return [];
  const e1 = x.replace(p, "");
  const e2 = y.replace(p, "");
  if (e1 === e2) return [];
  const m = `${e1}${e2}`;
  if (!ctx.getSegment(m)) return [];
  return [{ deps: [mkStmt("midpt", [seg(m), pt(p)])] }];
};

const midptConvGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "midpt") return [];
  const [m, p] = conclusion.arguments.map((a) => a.v);
  if (m.length !== 2 || p.length !== 1) return [];
  const dep = congSegPair(`${m[0]}${p}`, `${m[1]}${p}`, ctx);
  return dep && dep.function === "con_seg" ? [{ deps: [dep] }] : [];
};

const defPerpGen: Generator = ({ conclusion, ctx, facts }) => {
  if (conclusion.arguments.length !== 3) return [];
  const p = conclusion.arguments[2].v;
  const candidates: DepCandidate[] = [];
  for (const f of facts.byFunction(["right"])) {
    const a = ctx.getAngle(f.stmt.arguments[0]?.v ?? "");
    if (a && a.center.label === p) candidates.push({ deps: [f.stmt] });
  }
  return dedupeCandidates(candidates, ctx);
};

/** con_ang / con_right at a perpendicular intersection ← perp(s1,s2,p). */
const perpConAngGen: Generator = ({ conclusion, ctx, facts }) => {
  if (conclusion.arguments.length !== 2) return [];
  const [a1, a2] = conclusion.arguments.map((a) => ctx.getAngle(a.v));
  if (!a1 || !a2) return [];
  if (a1.center.label !== a2.center.label) return [];
  const p = a1.center.label;
  const candidates: DepCandidate[] = [];
  for (const f of facts.byFunction(["perp"])) {
    if (f.stmt.arguments[2]?.v === p) candidates.push({ deps: [f.stmt] });
  }
  // Subgoal shape: perp through p along the angles' outer rays. The perp's
  // segments may be full lines the rays only partially cover (perp(AC,BD,D)
  // supporting angle ADB), so parent segments join the candidate pool.
  const withParents = (label: string) => {
    const s = ctx.getSegment(label);
    if (!s) return [];
    return [s, ...s.getParentSegments()];
  };
  for (const n1 of a1.names) {
    const [x, y] = [n1[0], n1[2]];
    for (const s1 of withParents(`${x}${p}`)) {
      for (const s2 of withParents(`${y}${p}`)) {
        if (s1 === s2) continue;
        candidates.push({
          deps: [mkStmt("perp", [seg(s1.label), seg(s2.label), pt(p)])],
        });
      }
    }
  }
  return dedupeCandidates(candidates, ctx);
};

const defConRightGen: Generator = ({ conclusion }) => {
  if (conclusion.arguments.length !== 2) return [];
  const [a1, a2] = conclusion.arguments;
  return [
    { deps: [mkStmt("right", [a1]), mkStmt("right", [a2])] },
  ];
};

const baseAngleGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "con_ang") return [];
  const [a1, a2] = conclusion.arguments.map((a) => ctx.getAngle(a.v));
  if (!a1 || !a2 || a1 === a2) return [];
  const candidates: DepCandidate[] = [];
  for (const t of ctx.getTriangles()) {
    if (!t.contains(a1) || !t.contains(a2)) continue;
    const c1 = a1.center.label;
    const c2 = a2.center.label;
    const apex = t.getThirdPoint(c1, c2);
    if (apex.length !== 1) continue;
    const dep = congSegPair(`${apex}${c1}`, `${apex}${c2}`, ctx);
    if (dep && dep.function === "con_seg") candidates.push({ deps: [dep] });
  }
  return dedupeCandidates(candidates, ctx);
};

const baseAngleConvGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "con_seg") return [];
  const [x, y] = conclusion.arguments.map((a) => a.v);
  if (x.length !== 2 || y.length !== 2) return [];
  const apex = commonLetter(x, y);
  if (!apex) return [];
  const b1 = x.replace(apex, "");
  const b2 = y.replace(apex, "");
  if (b1 === b2) return [];
  const dep = congAngPair(`${apex}${b1}${b2}`, `${apex}${b2}${b1}`, ctx);
  return dep && dep.function === "con_ang" ? [{ deps: [dep] }] : [];
};

const thirdAngleGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "con_ang") return [];
  const [a1, a2] = conclusion.arguments.map((a) => ctx.getAngle(a.v));
  if (!a1 || !a2 || a1 === a2) return [];
  const candidates: DepCandidate[] = [];
  const triangles = ctx.getTriangles();
  for (const t1 of triangles) {
    if (!t1.contains(a1)) continue;
    for (const t2 of triangles) {
      if (t1 === t2 || !t2.contains(a2)) continue;
      const rest1 = t1.a.filter((a) => !a.equals(a1));
      const rest2 = t2.a.filter((a) => !a.equals(a2));
      if (rest1.length !== 2 || rest2.length !== 2) continue;
      const pairings: Array<[number, number, number, number]> = [
        [0, 0, 1, 1],
        [0, 1, 1, 0],
      ];
      for (const [i, j, k, l] of pairings) {
        const d1 = congAngPair(rest1[i].label, rest2[j].label, ctx);
        const d2 = congAngPair(rest1[k].label, rest2[l].label, ctx);
        if (d1?.function === "con_ang" && d2?.function === "con_ang") {
          candidates.push({ deps: [d1, d2] });
        }
      }
    }
  }
  return dedupeCandidates(candidates, ctx);
};

const defIsoscelesGen: Generator = ({ conclusion, ctx }) => {
  const t = ctx.getTriangle(conclusion.arguments[0]?.v ?? "");
  if (!t) return [];
  const candidates: DepCandidate[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dep = congSegPair(t.s[i].label, t.s[j].label, ctx);
      if (dep && dep.function === "con_seg") candidates.push({ deps: [dep] });
    }
  }
  return dedupeCandidates(candidates, ctx);
};

const defEquilateralGen: Generator = ({ conclusion, ctx }) => {
  const t = ctx.getTriangle(conclusion.arguments[0]?.v ?? "");
  if (!t) return [];
  const deps = compact([
    congSegPair(t.s[0].label, t.s[1].label, ctx),
    congSegPair(t.s[1].label, t.s[2].label, ctx),
    congSegPair(t.s[2].label, t.s[0].label, ctx),
  ]);
  return deps && deps.every((d) => d.function === "con_seg")
    ? [{ deps }]
    : [];
};

const defEquiangularGen: Generator = ({ conclusion, ctx }) => {
  const t = ctx.getTriangle(conclusion.arguments[0]?.v ?? "");
  if (!t) return [];
  const deps = compact([
    congAngPair(t.a[0].label, t.a[1].label, ctx),
    congAngPair(t.a[1].label, t.a[2].label, ctx),
    congAngPair(t.a[2].label, t.a[0].label, ctx),
  ]);
  return deps && deps.every((d) => d.function === "con_ang")
    ? [{ deps }]
    : [];
};

/** Simple restatement reasons: conclusion `f(args)` ← `depFn(args)`. */
const restatementGen =
  (depFn: string): Generator =>
  ({ conclusion }) => [
    { deps: [mkStmt(depFn, conclusion.arguments)] },
  ];

const defParallelogramGen: Generator = ({ conclusion, ctx }) => {
  const q = conclusion.arguments[0]?.v ?? "";
  if (q.length !== 4) return [];
  const side = (i: number, j: number) => {
    const s = ctx.getSegment(`${q[i]}${q[j]}`);
    return s ? s.label : null;
  };
  const p1a = side(0, 1);
  const p1b = side(3, 2);
  const p2a = side(1, 2);
  const p2b = side(0, 3);
  if (!p1a || !p1b || !p2a || !p2b) return [];
  return [
    {
      deps: [
        mkStmt("para", [seg(p1a), seg(p1b)]),
        mkStmt("para", [seg(p2a), seg(p2b)]),
      ],
    },
    {
      deps: [
        mkStmt("para", [seg(p2a), seg(p2b)]),
        mkStmt("para", [seg(p1a), seg(p1b)]),
      ],
    },
  ];
};

const angBisectConvGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "ang_bisect") return [];
  const [a, s] = conclusion.arguments.map((x) => x.v);
  if (a.length !== 3 || s.length !== 2) return [];
  const c = a[1];
  if (!s.includes(c)) return [];
  const m = s.replace(c, "");
  const dep = congAngPair(`${a[0]}${c}${m}`, `${m}${c}${a[2]}`, ctx);
  return dep && dep.function === "con_ang" ? [{ deps: [dep] }] : [];
};

const defAngBisectGen: Generator = ({ conclusion, ctx }) => {
  if (conclusion.function !== "con_ang") return [];
  const [a1, a2] = conclusion.arguments.map((x) => ctx.getAngle(x.v));
  if (!a1 || !a2 || a1 === a2) return [];
  if (a1.center.label !== a2.center.label) return [];
  const c = a1.center.label;
  const shared = a1.sharedSide(a2);
  if (!shared) return [];
  const m = shared.shared.replace(c, "");
  if (m.length !== 1) return [];
  const full = ctx.getAngle(`${shared.thisThird}${c}${shared.otherThird}`);
  const bisector = ctx.getSegment(`${c}${m}`);
  if (!full || !bisector) return [];
  return [
    {
      deps: [mkStmt("ang_bisect", [ang(full.label), seg(bisector.label)])],
    },
  ];
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Reasons whose geometric check is an unimplemented placeholder
 * (`default: return true` in `reasonApplication.ts`). The solver must not
 * generate steps with them — they would be free wins for any conclusion of
 * the right shape.
 */
export const UNIMPLEMENTED_REASONS = new Set([
  "circumcenter",
  "incenter",
  "square",
  "rhombus",
  "rect_para_right_opp",
  "para_transitive",
  "con_arc",
  "csstp",
  "inscribed_semi",
  "para_con_arcs",
  "con_chords_intersect_arcs",
  "def_radius",
  "tangent_diam_perp",
  "sim_tri_transitive",
  "inscribed_angs",
]);

const GENERATORS: Record<string, Generator> = {
  sas: triCongGen("sas"),
  sss: triCongGen("sss"),
  asa: triCongGen("asa"),
  aas: triCongGen("aas"),
  rhl: triCongGen("rhl"),
  def_con_tri: triCongGen("def_con_tri"),
  aa_sim: triCongGen("aa_sim"),
  cpctc: cpctcGen,
  reflex: reflexGen,
  vert_ang: vertAngGen,
  altint: transversalParaDepGen,
  altext: transversalParaDepGen,
  corresp_ang: transversalParaDepGen,
  sameside_ang: transversalParaDepGen,
  altint_conv: transversalConvGen("altint", "con_ang"),
  altext_conv: transversalConvGen("altext", "con_ang"),
  corresp_ang_conv: transversalConvGen("corresp", "con_ang"),
  sameside_ang_conv: transversalConvGen("sameside", "supplementary"),
  con_seg_transitive: transitiveGen("con_seg"),
  con_ang_transitive: transitiveGen("con_ang"),
  con_tri_transitive: transitiveGen("con_tri"),
  con_supplements_same: conSameGen("supplementary"),
  con_complements_same: conSameGen("complementary"),
  def_midpt: defMidptGen,
  midpt_conv: midptConvGen,
  def_perp: defPerpGen,
  perp_con_ang: perpConAngGen,
  def_con_right: defConRightGen,
  base_angle: baseAngleGen,
  base_angle_conv: baseAngleConvGen,
  third_angle: thirdAngleGen,
  def_isosceles: defIsoscelesGen,
  def_equilateral: defEquilateralGen,
  def_equiangular: defEquiangularGen,
  equilat_equiang: restatementGen("equilateral"),
  equiang_equilat: restatementGen("equiangular"),
  def_linear_pair: restatementGen("linear_pair"),
  linear_pair_conv: restatementGen("supplementary"),
  def_parallelogram: defParallelogramGen,
  ang_bisect_conv: angBisectConvGen,
  def_ang_bisect: defAngBisectGen,
};

/**
 * Enumerate dependency-statement candidates for concluding `conclusion` via
 * `reason`. Returns `undefined` when no bespoke generator exists — the caller
 * then falls back to fact-index enumeration.
 */
export const depsFromConclusion = (
  reason: string,
  input: GeneratorInput,
): DepCandidate[] | undefined => {
  const gen = GENERATORS[reason];
  return gen ? gen(input) : undefined;
};
