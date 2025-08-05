import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SVGModes } from "../types/types";
import { ModeCSS } from "./SVGStyles";
import { updateStyle } from "./svgUtils";
const colors = [
    {
        id: SVGModes.Derived,
        class: ModeCSS.DERIVED,
    },
    { id: SVGModes.Unfocused, class: ModeCSS.UNFOCUSED },
    { id: SVGModes.ReliesOn, class: ModeCSS.RELIES },
    { id: SVGModes.Inconsistent, class: ModeCSS.INCONSISTENT },
];
const patternEle = (rotate, c) => (_jsxs("pattern", { id: `line-pattern-${rotate}-${c.id}`, patternUnits: "userSpaceOnUse", width: "10", height: "10", patternTransform: `scale(.5) rotate(${rotate})`, children: [_jsx("rect", { x: "0", y: "0", width: "100%", height: "100%", fill: "none" }), _jsx("path", { d: "M0 10h20z", "stroke-width": "1", className: `${updateStyle(c.id)} ${c.id === SVGModes.Unfocused || c.id === SVGModes.ReliesOn
                ? "opacity-5"
                : "opacity-30"}`, fill: "none" })] }));
export const getPatternId = (mode, isSecond) => {
    return `line-pattern-${isSecond ? 135 : 45}-${mode}`;
};
export const LinePatternDefs = (
// need to predefine all of the possible color options and ids
_jsxs("defs", { children: [colors.map((c) => patternEle(45, c)), colors.map((c) => patternEle(135, c))] }));
//# sourceMappingURL=LinePattern.js.map