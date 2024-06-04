export const congruent = (
  <span className="text-xl leading-4 font-extralight">{`\u2245`}</span>
);

export const parallel = (
  <span className="text-xl leading-4 font-normal">{" \u2225 "}</span>
);

export const comma = <span>{",\t"}</span>;

export const perpendicular = (
  <span className="text-xl leading-4 font-normal">{" \u22A5 "}</span>
);

// for static text
export const segmentStr = (s: string, clr?: string) => (
  <span
    className="font-notoSerif"
    style={{ borderTop: `2px solid ${clr || "black"}` }}
  >
    {s}
  </span>
);
// for static text
export const triangleStr = (t: string) => (
  <span className="font-notoSerif">
    <span className="text-l leading-4 font-semibold">{`\u25B3`}</span>
    {t}
  </span>
);
// for static text
export const angleStr = (a: string) => (
  <span className="font-notoSerif">
    <span className="text-2xl leading-4">{`\u2220`}</span>
    {a}
  </span>
);

export const strs = {
  angle: "\u29A3",
  congruent: "\u2245",
  parallel: "\u2225",
  comma: ",\t",
  triangle: "\u0394",
  right: " = 90°",
  perpendicular: "\u22A5",
};
