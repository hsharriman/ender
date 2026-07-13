const segment = (s: string) => `Segment ${s}`;
const angle = (a: string) => `Angle ${a}`;
const triangle = (t: string) => `Triangle ${t}`;
const point = (p: string) => `Point ${p}`;
const quadrilateral = (q: string) => `Quadrilateral ${q}`;
const circle = (c: string) => `Circle ${c}`;
const arc = (a: string) => `Arc ${a}`;

export const STMTS_DEFS = {
  statements: {
    on_line: {
      name: "on_line",
      parameters: [segment("s"), point("p")],
      isPremisesOnly: true,
      isDiagramOnly: true,
    },
    // A transversal is the line crossing two other lines (line1: s1p1-s1p2, line2: s2p1-s2p2).
    // i1/i2 are where the transversal crosses line1/line2. t1/t2 are the
    // transversal's two endpoints past each crossing: t1 is beyond line1 (the far side from
    // line2), t2 is beyond line2 (the far side from line1). Along the transversal the order
    // is t1 - i1 - ... - i2 - t2, so t1/i1 and t2/i2 are generally four distinct points. they only
    // collapse to two points when the transversal's endpoints land exactly on the lines.
    transversal: {
      name: "transversal",
      parameters: [
        point("s1p1"),
        point("s1p2"),
        point("t1"),
        point("i1"),
        point("s2p1"),
        point("s2p2"),
        point("t2"),
        point("i2"),
      ],
      isPremisesOnly: true,
      isDiagramOnly: true,
      allowDupeArgs: true,
    },
    intersect_seg: {
      name: "intersect_seg",
      parameters: [segment("s1"), segment("s2"), point("p")],
      isPremisesOnly: true,
      isDiagramOnly: true,
    },
    trapezoid_premise: {
      name: "trapezoid_premise",
      parameters: [quadrilateral("q"), segment("s1"), segment("s2")],
      isPremisesOnly: true,
    },
    kite_premise: {
      name: "kite_premise",
      parameters: [quadrilateral("q"), angle("a1"), angle("a2")],
      isPremisesOnly: true,
    },
    isos_trapezoid_premise: {
      // same handling as trapezoid_premise
      name: "isos_trapezoid_premise",
      parameters: [quadrilateral("q"), segment("s1"), segment("s2")],
      isPremisesOnly: true,
    },
    right: {
      name: "right",
      parameters: [angle("a")],
      isPremisesOnly: true,
    },
    con_seg: {
      name: "con_seg",
      parameters: [segment("s1"), segment("s2")],
    },
    con_ang: {
      name: "con_ang",
      parameters: [angle("a1"), angle("a2")],
      group: "congruent_angs",
    },
    con_tri: {
      name: "con_tri",
      parameters: [triangle("t1"), triangle("t2")],
    },
    con_right: {
      name: "con_right",
      parameters: [angle("a1"), angle("a2")],
      group: "congruent_angs",
    },
    para: {
      name: "para",
      parameters: [segment("s1"), segment("s2")],
    },
    isosceles: {
      name: "isosceles",
      parameters: [triangle("t")],
    },
    perp: {
      name: "perp",
      parameters: [segment("s1"), segment("s2"), point("p")],
    },
    midpt: {
      name: "midpt",
      parameters: [segment("s"), point("p")],
    },
    ang_bisect: {
      name: "ang_bisect",
      parameters: [angle("a"), segment("s")],
    },
    rectangle: {
      name: "rectangle",
      parameters: [quadrilateral("q")],
    },
    parallelogram: {
      name: "parallelogram",
      parameters: [quadrilateral("q")],
    },
    sim_seg: {
      name: "sim_seg",
      parameters: [segment("s1"), segment("s2")],
    },
    sim_tri: {
      name: "sim_tri",
      parameters: [triangle("t1"), triangle("t2")],
    },
    equilateral: {
      name: "equilateral",
      parameters: [triangle("t")],
    },
    supplementary: {
      name: "supplementary",
      parameters: [angle("a1"), angle("a2")],
    },
    complementary: {
      name: "complementary",
      parameters: [angle("a1"), angle("a2")],
    },
    linear_pair: {
      name: "linear_pair",
      parameters: [angle("a1"), angle("a2")],
    },
    equiangular: {
      name: "equiangular",
      parameters: [triangle("t")],
    },
    circumcenter: {
      name: "circumcenter",
      parameters: [point("p"), triangle("t")],
    },
    incenter: {
      name: "incenter",
      parameters: [point("p"), triangle("t")],
    },
    perp_bisector: {
      // s1 bisects s2 at p
      name: "perp_bisector",
      parameters: [segment("s1"), segment("s2"), point("p")],
    },
    seg_bisect: {
      // s1 bisects s2 at p
      name: "seg_bisect",
      parameters: [segment("s1"), segment("s2"), point("p")],
    },
    isos_trapezoid: {
      name: "isos_trapezoid",
      parameters: [quadrilateral("q")],
    },
    rhombus: {
      name: "rhombus",
      parameters: [quadrilateral("q")],
    },
    // circle objects:
    tangent: {
      name: "tangent",
      parameters: [circle("c"), segment("s"), point("p")],
    },
    chord: {
      name: "chord",
      parameters: [circle("c"), segment("s")],
    },
    arc: {
      name: "arc",
      parameters: [circle("c"), point("p1"), point("p2")],
    },
    radius: {
      name: "radius",
      parameters: [circle("c"), point("p")],
    },
    diameter: {
      name: "diameter",
      parameters: [circle("c"), segment("s")],
    },
    inscribed_angle: {
      name: "inscribed_angle",
      parameters: [circle("c"), angle("a")],
    },
    // arc_bisect: {
    //   name: "arc_bisect",
    //   parameters: [arc("a"), segment("s"), point("p")],
    // },
    ref_seg: {
      name: "ref_seg",
      parameters: [segment("s1"), segment("s2")],
      allowDupeArgs: true,
    },
    ref_ang: {
      name: "ref_ang",
      parameters: [angle("a1"), angle("a2")],
      allowDupeArgs: true,
    },
    con_arc: {
      name: "con_arc",
      parameters: [arc("a1"), arc("a2")],
    },
  },
  groups: {
    congruent_angs: {
      name: "congruent_angs",
      base: "con_ang",
      extensions: ["con_right"],
    },
    con_seg_ref_allow: {
      name: "con_seg_ref_allow",
      base: "con_seg",
      extensions: ["ref_seg"],
    },
    con_ang_ref_allow: {
      name: "con_ang_ref_allow",
      base: "con_ang",
      extensions: ["ref_ang", "con_right"],
    },
    pgram_obj: {
      name: "pgram_obj",
      base: "parallelogram",
      extensions: ["rhombus", "rectangle"],
    },
    trapez_prem_obj: {
      name: "trapez_obj",
      base: "trapezoid_premise",
      extensions: ["isos_trapezoid_premise"],
    },
    isos_trap_obj: {
      name: "isos_trap_obj",
      base: "isos_trapezoid_premise",
      extensions: ["isos_trapezoid"],
    },
  },
} as const;
