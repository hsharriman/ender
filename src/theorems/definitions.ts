export interface Definition {
  keyword: string;
  definition: string;
}
const Parallel: Definition = {
  keyword: "Parallel",
  definition: "Lines that don't intersect.",
};
const Perpendicular: Definition = {
  keyword: "Perpendicular",
  definition: "Lines that intersect at 90\u00B0.",
};
const CongruentLines: Definition = {
  keyword: "Congruent lines",
  definition: "Lines that are the same length.",
};
const CongruentAngles: Definition = {
  keyword: "Congruent angles",
  definition: "Angles that have the same angle measure.",
};
const CongruentTriangles: Definition = {
  keyword: "Congruent triangles",
  definition: "Triangles that are the same size and shape.",
};

export const definitions = {
  Parallel,
  Perpendicular,
  CongruentLines,
  CongruentAngles,
  CongruentTriangles,
};
