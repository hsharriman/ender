import { reasonDef, ReasonDef } from "checker/grammar/catalog";

/** A reason's catalog entry, with what the interface needs to show it. */
export type ReasonVis = ReasonDef & {
  /** The image of its definition, `public/reasons/<src>.png`. */
  src: string;
};

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

/** The reason named `fn`, or a blank one when it has no catalog entry. */
export const reasonFromFunction = (fn?: string): ReasonVis => {
  const key = (fn ?? "").toLowerCase();
  const def = reasonDef(key);
  if (!def)
    return {
      name: key,
      title: fn ?? "",
      body: "",
      dependencies: [],
      conclusions: [],
      src: "",
    };
  return { ...def, src: SRC_MAP[key] ?? "" };
};

/** Whether a reason is `given`, which states a premise rather than a step. */
export const isGiven = (reason: ReasonVis): boolean => reason.name === "given";
