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
//# sourceMappingURL=types.js.map