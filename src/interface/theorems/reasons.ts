import { REASONS_DEFS } from "checker/grammar/defs/reasons.defs";

export interface ReasonItem {
  title: string;
  body: string;
  src?: string; // used to load static diagram image from public/reasons/<src>.png
}

// used for linking reasons to images of their definitions.
const SRC_MAP: Partial<Record<string, string>> = {
  sas: "SAS",
  sss: "SSS",
  asa: "ASA",
  aas: "AAS",
  rhl: "RHL",
  cpctc: "CPCTC",
  vert_ang: "vertical-angles",
  altint: "alt-interior-angles",
  altint_conv: "alt-interior-angles",
  perpendicular: "perpendicular",
  def_perp: "perpendicular",
  reflex: "reflexive",
  def_midpt: "midpoint",
  midpt_conv: "midpoint",
  def_con_right: "cong-right-angles",
  perp_con_ang: "cong-adj-angles",
  rectangle: "rectangle",
  def_isosceles: "isosceles",
  rectangle_pgram: "parallelogram",
  paralellogram2: "parallelogram",
  def_ang_bisect: "bisector",
  ang_bisect_conv: "bisector",
  perp_bisector: "perp-bisector",
};

export const reasonFromFunction = (fn?: string): ReasonItem => {
  if (!fn) return { title: "", body: "", src: "" };
  const key = fn.toLowerCase();
  const def = REASONS_DEFS[key as keyof typeof REASONS_DEFS];
  if (!def) return { title: fn, body: "", src: "" };
  return { title: def.title, body: def.body, src: SRC_MAP[key] ?? "" };
};
