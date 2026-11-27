import { SVGModes } from "../types/diagramTypes";

export const ModeCSS = {
  HIDDEN: "opacity-0",
  DEFAULT: "stroke-black stroke-2 fill-none opacity-1",
  UNFOCUSED: "opacity-50 stroke-black stroke-1 fill-none",
  DERIVED: "stroke-blue-500 stroke-[3px] fill-none",
  RELIES: "stroke-black stroke-[3px] fill-none",
  INCONSISTENT: "stroke-red-500 stroke-[3px] fill-none",
  UNESTABLISHED: "stroke-slate-400 stroke-[3px] fill-none",

  // for text/fills in single-diagram
  UNFOCUSEDFILL: "opacity-30 fill-black",
  DERIVEDFILL: "fill-blue-500",
  RELIESFILL: "fill-black font-bold",
  INCONSISTENTFILL: "fill-red-500 stroke-none",
  UNESTABLISHEDFILL: "fill-slate-400 stroke-none",
};

/**
 * The colors of an angle highlight's radial gradient, by mode: at the
 * vertex, then at the rim.  The gradient's stops take `currentColor`, so
 * these set it.  Modes left out draw no highlight.
 */
export const AngleHighlightCSS: Partial<
  Record<SVGModes, { inner: string; outer: string }>
> = {
  [SVGModes.Derived]: { inner: "text-blue-500/100", outer: "text-blue-500/0" },
  [SVGModes.ReliesOn]: { inner: "text-black/30", outer: "text-black/0" },
};
