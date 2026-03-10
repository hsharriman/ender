export var Obj;
(function (Obj) {
    Obj["Point"] = "point";
    Obj["Segment"] = "segment";
    Obj["Text"] = "text";
    // Circle,
    Obj["Angle"] = "angle";
    Obj["ParallelTick"] = "parallel";
    Obj["EqualLengthTick"] = "equallength";
    Obj["Triangle"] = "triangle";
    Obj["EqualAngleTick"] = "equalangle";
    Obj["Tick"] = "tick";
    Obj["HiddenTick"] = "hiddentick";
    Obj["RightTick"] = "righttick";
    Obj["Quadrilateral"] = "rectangle";
})(Obj || (Obj = {}));
export var SVGModes;
(function (SVGModes) {
    SVGModes["Hidden"] = "hidden";
    SVGModes["Unfocused"] = "unfocused";
    SVGModes["Default"] = "default";
    SVGModes["ReliesOn"] = "relieson";
    SVGModes["Derived"] = "derived";
    SVGModes["Inconsistent"] = "inconsistent";
})(SVGModes || (SVGModes = {}));
// for determining what type of styling to apply to an object
export var HighlightType;
(function (HighlightType) {
    HighlightType["Relies"] = "relies";
    HighlightType["ReliesUnmet"] = "reliesunmet";
    HighlightType["Highlight"] = "highlight";
    HighlightType["HighlightUnmet"] = "highlightunmet";
})(HighlightType || (HighlightType = {}));
// Define AspectRatio locally since we removed diagramSvg
export var AspectRatio;
(function (AspectRatio) {
    AspectRatio["Square"] = "square";
    AspectRatio["Wide"] = "wide";
    AspectRatio["Tall"] = "tall";
    AspectRatio["Landscape"] = "landscape";
})(AspectRatio || (AspectRatio = {}));
// basic vector helpers used in UI and geometry code
export const vops = {
    add: (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]],
    sub: (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]],
    smul: (v, s) => [v[0] * s, v[1] * s],
    div: (v, s) => [v[0] / s, v[1] / s],
    mag: (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]),
    dot: (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1],
    rot: (v, deg) => {
        const rad = (deg * Math.PI) / 180;
        const [x, y] = v;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return [c * x - s * y, s * x + c * y];
    },
};
//# sourceMappingURL=types.js.map