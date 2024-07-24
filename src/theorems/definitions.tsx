import { resizedStrs } from "../core/geometryText";
import { Reason } from "../core/types/types";

export type Definition = {
  symbol: JSX.Element;
} & Reason;

const Parallel: Definition = {
  symbol: resizedStrs.parallel,
  title: "Parallel",
  body: "Lines that don't intersect.",
};
const Perpendicular: Definition = {
  symbol: resizedStrs.perpendicular,
  title: "Perpendicular",
  body: "Lines that intersect at 90\u00B0.",
};
const CongruentLines: Definition = {
  symbol: resizedStrs.congruent,
  title: "Congruent lines",
  body: "Lines that are the same length.",
};
const CongruentAngles: Definition = {
  symbol: resizedStrs.congruent,
  title: "Congruent angles",
  body: "Angles that have the same angle measure.",
};
const CongruentTriangles: Definition = {
  symbol: resizedStrs.congruent,
  title: "Congruent triangles",
  body: "Triangles that are the same size and shape.",
};
const Bisector: Definition = {
  symbol: <span>"bisects"</span>,
  title: "Angle bisector",
  body: "A line that divides an angle into two equal angles.",
};
const Congruent = {
  symbol: resizedStrs.congruent,
  title: "Congruent",
  body: "Objects that have the same size and shape.",
};

export const definitions = {
  Parallel,
  Perpendicular,
  CongruentLines,
  CongruentAngles,
  CongruentTriangles,
  Bisector,
};

export const definitionArr = [Parallel, Perpendicular, Congruent, Bisector];
