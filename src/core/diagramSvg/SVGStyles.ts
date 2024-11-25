export const ModeCSS = {
  HIDDEN: "opacity-0",
  FOCUSED: "stroke-black stroke-2 fill-none opacity-1",
  ACTIVE: "stroke-violet-500 stroke-[4px] drop-shadow-[0_0_5px_#8b5cf6]",
  DEFAULT: "stroke-black stroke-2 fill-none opacity-1",
  PURPLE: "stroke-purple-700 stroke-[5px] fill-none opacity-1",
  ACTIVETEXT: "fill-violet-500 stroke-violet-500 stroke-[1px]",
  DIAGRAMTEXTGLOW:
    "fill-violet-600 stroke-violet-600 stroke-[1px] drop-shadow-[0_0_5px_#8b5cf6]",
  PINNED: "stroke-violet-500 stroke-[4px] pinnedSVG",
  DIAGRAMGLOW: "stroke-violet-600 stroke-[3px] drop-shadow-[0_0_5px_#8b5cf6]",
  DIAGRAMCLICKTEXT: "text-violet-500 font-black",
  // for single-diagram redesign
  UNFOCUSED: "opacity-50 stroke-black stroke-1 fill-none",
  DERIVED: "stroke-blue-500 stroke-[3px]",
  RELIES: "stroke-black stroke-[3px]",
  INCONSISTENT: "stroke-red-500 stroke-[3px]",

  // for text in single-diagram
  UNFOCUSEDFILL: "opacity-30 fill-black",
  DERIVEDFILL: "fill-blue-500",
  RELIESFILL: "fill-black font-bold",
  INCONSISTENTFILL: "fill-red-500 stroke-none",
};
