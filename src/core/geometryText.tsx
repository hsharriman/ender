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
  angle: "\u2220",
  congruent: "\u2245",
  parallel: "\u2225",
  comma: ",\t",
  triangle: "\u25B3",
  right: " = 90°",
  perpendicular: "\u22A5",
};

// TODO check that these scale for windows and mac
export const resizedStrs = {
  congruent: (
    <span
      style={
        navigator.userAgent.includes("Mac")
          ? {
              fontSize: "2rem",
              verticalAlign: "baseline",
              lineHeight: "24px",
            }
          : {}
      }
    >
      {"\u2245"}
    </span>
  ),
  parallel: (
    <span
      style={
        navigator.userAgent.includes("Mac")
          ? {
              fontSize: "2rem",
              verticalAlign: "baseline",
              lineHeight: "24px",
            }
          : {}
      }
    >
      {" \u2225 "}
    </span>
  ),
  perpendicular: (
    <span
      style={
        navigator.userAgent.includes("Mac")
          ? {
              fontSize: "2rem",
              verticalAlign: "baseline",
              lineHeight: "24px",
            }
          : {}
      }
    >
      {" \u22A5 "}
    </span>
  ),
};

// for segments in questions
export const segmentQuestion = (s: string, clr?: string) => (
  <span style={{ borderTop: `2px solid ${clr || "black"}` }}>{s}</span>
);
