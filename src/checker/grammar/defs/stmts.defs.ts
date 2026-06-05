const segment = (s: string) => `Segment ${s}`;
const angle = (a: string) => `Angle ${a}`;
const triangle = (t: string) => `Triangle ${t}`;
const point = (p: string) => `Point ${p}`;
const quadrilateral = (q: string) => `Quadrilateral ${q}`;

export const STMTS_DEFS = {
  statements: {
    on_line: {
      name: "on_line",
      parameters: [segment("s"), point("p")],
      isPremisesOnly: true,
      group: "point_on_line",
    },
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
    },
    intersect_seg: {
      name: "intersect_seg",
      parameters: [segment("s1"), segment("s2"), point("p")],
      isPremisesOnly: true,
    },
    right: {
      name: "right",
      parameters: [angle("a")],
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
      parameters: [segment("s1"), segment("s2")],
    },
    midpt: {
      name: "midpt",
      parameters: [segment("s"), point("p")],
      group: "point_on_line",
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
    // unimplemented statements that will always return true for now
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
      name: "perp_bisector",
      parameters: [segment("s1"), segment("s2"), point("p")],
    },
    seg_bisect: {
      name: "seg_bisect",
      parameters: [segment("s1"), segment("s2"), point("p")],
    },
    kite: {
      name: "kite",
      parameters: [quadrilateral("q")],
    },
    isos_trapezoid: {
      name: "isos_trapezoid",
      parameters: [quadrilateral("q")],
    },
    rhombus: {
      name: "rhombus",
      parameters: [quadrilateral("q")],
    },
    trapezoid: {
      name: "trapezoid",
      parameters: [quadrilateral("q")],
    },
  },
  groups: {
    congruent_angs: {
      name: "congruent_angs",
      base: "con_ang",
      extensions: ["con_right"],
    },
    point_on_line: {
      name: "point_on_line",
      base: "on_line",
      extensions: ["midpt"],
    },
  },
} as const;
