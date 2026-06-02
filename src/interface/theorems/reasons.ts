import { loadReasonDefinitions } from "checker/grammar/defsParsers";

export interface ReasonItem {
  title: string;
  body: string;
  src?: string;
  /** Checker-derived dependency expectations; shown below `body` in the UI. */
  // expectedDependenciesDescription?: string;
}

const EMPTY_REASON: ReasonItem = { title: "", body: "", src: "" };

// const reasonDefinitions = loadReasonDefinitions();

// const expectedDependenciesDescriptionFor = (
//   reasonFn?: string,
// ): string | null => {
//   if (!reasonFn) return null;
//   const def = reasonDefinitions.get(reasonFn.toLowerCase());
//   if (!def) return null;
//   const expected = def.dependencies.map((dep) =>
//     typeof dep === "string" ? dep : dep.name,
//   );
//   if (expected.length === 0) return "expects 0 dependencies.";
//   return `This reason expects ${expected.length} dependencies, in order of: ${expected.join(", ")}.`;
// };

export const reasonFromFunction = (fn?: string): ReasonItem => {
  if (!fn) return EMPTY_REASON;
  const key = fn.toLowerCase();
  const map: Record<string, ReasonItem> = {
    given: { title: "Given", body: "", src: "" },
    sas: {
      title: "SAS Triangle Congruence",
      body: "Side-Angle-Side (SAS) Congruence. If two sides and the included angle of each triangle are congruent to each other, then the triangles are congruent.",
      src: "SAS",
    },
    sss: {
      title: "SSS Triangle Congruence",
      body: "Side-Side-Side (SSS) Triangle Congruence. If two triangles have three sides that are congruent to each other, then the triangles are congruent.",
      src: "SSS",
    },
    asa: {
      title: "ASA Triangle Congruence",
      body: "Angle-Side-Angle (ASA) Triangle Congruence. If two triangles have two congruent angles and one included congruent side, then the triangles are congruent.",
      src: "ASA",
    },
    aas: {
      title: "AAS Triangle Congruence",
      body: "Angle-Angle-Side (AAS) Triangle Congruence. If a pair of triangles have two angles and one adjacent side that are congruent to each other, then the triangles are congruent.",
      src: "AAS",
    },
    rhl: {
      title: "RHL Triangle Congruence",
      body: "Right-Hypotenuse-Leg (RHL) Triangle Congruence. If two right triangles have a hypotenuse and a leg that are congruent to each other, then the triangles are congruent.",
      src: "RHL",
    },
    cpctc: {
      title: "CPCTC",
      body: "Corresponding Parts of Congruent Triangles are Congruent (CPCTC). If two triangles are congruent, then their corresponding angles and sides are also congruent.",
      src: "CPCTC",
    },
    vert_ang: {
      title: "Vertical Angles Theorem",
      body: "If two lines intersect then the angles that are opposite from each other are congruent.",
      src: "vertical-angles",
    },
    altint: {
      title: "Alternate Interior Angles Theorem",
      body: "If two parallel lines are cut by a transversal (a line that crosses two or more lines), then the formed alternate interior angles are congruent.",
      src: "alt-interior-angles",
    },
    altint_conv: {
      title: "Alternate Interior Angles (Converse)",
      body: "If a transversal (a line that crosses two or more lines) forms opposite interior angles that are congruent, then the two lines it intersects with are parallel to each other.",
      src: "alt-interior-angles",
    },
    perpendicular: {
      title: "Def. Perpendicular Lines",
      body: "If two lines meet at 90°, then they are perpendicular.",
      src: "perpendicular",
    },
    def_perp: {
      title: "Def. Perpendicular Lines",
      body: "If two lines meet at 90°, then they are perpendicular.",
      src: "perpendicular",
    },
    reflex_s: {
      title: "Reflexive Property",
      body: "Any geometric figure is congruent with itself.",
      src: "reflexive",
    },
    reflex_a: {
      title: "Reflexive Property",
      body: "Any geometric figure is congruent with itself.",
      src: "reflexive",
    },
    def_midpt: {
      title: "Def. Midpoint",
      body: "The point that is halfway between two endpoints of a segment.",
      src: "midpoint",
    },
    midpt_conv: {
      title: "Def. Midpoint (Converse)",
      body: "If two subsections of a line are congruent, then the point dividing those subsections is the midpoint.",
      src: "midpoint",
    },
    def_con_right: {
      title: "Congruent Right Angles",
      body: "Any two right angles are congruent (each measures 90°).",
      src: "cong-right-angles",
    },
    perp_con_ang: {
      title: "Perpendicular Adjacent Angles",
      body: "If two lines are perpendicular, then the formed adjacent angles are congruent. Each angle is 90°.",
      src: "cong-adj-angles",
    },
    rectangle: {
      title: "Def. Rectangle",
      body: "A rectangle is a type of parallelogram that has four right angles. The opposite sides of a rectangle are equal in length.",
      src: "rectangle",
    },
    isosceles: {
      title: "Def. Isosceles Triangle",
      body: "An isosceles triangle is a triangle with two congruent sides.",
      src: "isosceles",
    },
    parallelogram1: {
      title: "Def. Parallelogram",
      body: "A parallelogram is a quadrilateral with opposite sides that are parallel. The opposite sides of a parallelogram are equal in length.",
      src: "parallelogram",
    },
    parallelogram2: {
      title: "Def. Parallelogram",
      body: "A parallelogram is a quadrilateral with opposite sides that are parallel. The opposite sides of a parallelogram are equal in length.",
      src: "parallelogram",
    },
    def_ang_bisect: {
      title: "Def. Angle Bisector",
      body: "A line that splits an angle into two equal parts.",
      src: "bisector",
    },
    ang_bisect_conv: {
      title: "Def. Angle Bisector (Converse)",
      body: "If two adjacent angles are congruent, then the line that splits the angle is an angle bisector.",
      src: "bisector",
    },
    altext: {
      title: "Alternate Exterior Angles Theorem",
      body: "If two parallel lines are cut by a transversal (a line that crosses two or more lines), then the formed alternate exterior angles are congruent.",
      src: "",
    },
    altext_conv: {
      title: "Alternate Exterior Angles (Converse)",
      body: "If a transversal (a line that crosses two or more lines) forms opposite exterior angles that are congruent, then the two lines it intersects with are parallel to each other.",
      src: "",
    },
    sameside_ang: {
      title: "Same Side Interior Angles Theorem",
      body: "If two parallel lines are cut by a transversal (a line that crosses two or more lines), then the formed same side interior angles are supplementary.",
      src: "",
    },
    sameside_ang_conv: {
      title: "Same Side Interior Angles (Converse)",
      body: "If a transversal (a line that crosses two or more lines) forms same side interior angles that are supplementary, then the two lines it intersects with are parallel to each other.",
      src: "",
    },
    corresp_ang: {
      title: "Corresponding Angles",
      body: "If two parallel lines are cut by a transversal, then each pair of corresponding angles is congruent.",
      src: "",
    },
    corresp_ang_conv: {
      title: "Corresponding Angles (Converse)",
      body: "If a transversal (a line that crosses two or more lines) forms corresponding angles that are congruent, then the two lines it intersects with are parallel to each other.",
      src: "",
    },
    quadrilateral: {
      title: "Def. Quadrilateral",
      body: "Any four-sided polygon.",
      src: "quadrilateral",
    },
  };
  const base = map[key] ?? { title: fn, body: "", src: "" };
  // const depsDescription = expectedDependenciesDescriptionFor(key);
  // if (!depsDescription) return base;
  // return {
  //   ...base,
  //   // expectedDependenciesDescription: depsDescription,
  // };
  return base;
};
