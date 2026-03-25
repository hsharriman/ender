export const REASONS_DEFS = {
  isosceles: {
    name: "isosceles",
    dependencies: ["con_seg"],
    conclusion: "isosceles",
  },
  sas: {
    name: "sas",
    dependencies: ["con_seg", "congruent_angs", "con_seg"],
    conclusion: "con_tri",
  },
  sss: {
    name: "sss",
    dependencies: ["con_seg", "con_seg", "con_seg"],
    conclusion: "con_tri",
  },
  asa: {
    name: "asa",
    dependencies: ["congruent_angs", "con_seg", "congruent_angs"],
    conclusion: "con_tri",
  },
  aas: {
    name: "aas",
    dependencies: ["congruent_angs", "congruent_angs", "con_seg"],
    conclusion: "con_tri",
  },
  rhl: {
    name: "rhl",
    dependencies: ["con_right", "con_seg", "con_seg"],
    conclusion: "con_tri",
  },
  cpctc: {
    name: "cpctc",
    dependencies: ["con_tri"],
    conclusion: "con_seg, con_ang",
  },
  reflex_s: {
    name: "reflex_s",
    dependencies: [],
    conclusion: "con_seg",
  },
  perp: {
    name: "perp",
    dependencies: ["right", "point_on_line"],
    conclusion: "perp",
  },
  midpt: {
    name: "midpt",
    dependencies: ["midpt"],
    conclusion: "con_seg",
  },
  midpt_conv: {
    name: "midpt_conv",
    dependencies: ["con_seg"],
    conclusion: "midpt",
  },
  right: {
    name: "right",
    dependencies: ["perp"],
    conclusion: "right",
  },
  reflex_a: {
    name: "reflex_a",
    dependencies: [],
    conclusion: "con_ang",
  },
  vert_ang: {
    name: "vert_ang",
    dependencies: ["intersect_seg"],
    conclusion: "con_ang",
  },
  altint_conv: {
    name: "altint_conv",
    dependencies: ["con_ang", "transversal"],
    conclusion: "para",
  },
  altint: {
    name: "altint",
    dependencies: ["para", "transversal"],
    conclusion: "con_ang",
  },
  ang_bisect: {
    name: "ang_bisect",
    dependencies: ["ang_bisect"],
    conclusion: "con_ang",
  },
  ang_bisect_conv: {
    name: "ang_bisect_conv",
    dependencies: ["con_ang"],
    conclusion: "ang_bisect",
  },
  con_right: {
    name: "con_right",
    dependencies: ["right", "right"],
    conclusion: "con_ang",
  },
  perp_con_ang: {
    name: "perp_con_ang",
    dependencies: ["perp"],
    conclusion: "con_ang, con_right",
  },
  paralellogram1: {
    name: "paralellogram1",
    dependencies: ["rectangle"],
    conclusion: "parallelogram",
  },
  paralellogram2: {
    name: "paralellogram2",
    dependencies: ["para"],
    conclusion: "parallelogram",
  },
  rectangle: {
    name: "rectangle",
    dependencies: ["rectangle"],
    conclusion: "con_right, con_ang, con_seg",
  },
  equilateral: {
    name: "equilateral",
    dependencies: ["con_seg", "con_seg"],
    conclusion: "equilateral",
  },
  aaa: {
    name: "aaa",
    dependencies: ["con_ang", "con_ang", "con_ang"],
    conclusion: "sim_tri",
  },
  given: {
    name: "given",
    dependencies: ["__given_premise__"],
    conclusion: "__any__",
  },
} as const;
