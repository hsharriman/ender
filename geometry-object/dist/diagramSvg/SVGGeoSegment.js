import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
// import { addTutorialActive, logEvent } from "../testinfra/testUtils";
import { Obj, SVGModes } from "../types/types";
import { vops } from "../vectorOps";
import { coordsToSvg, updateStyle } from "./svgUtils";
export class SVGGeoSegment extends React.Component {
    constructor(props) {
        super(props);
        // deprecated
        this.onHoverLabelClick = (isActive) => {
            this.setState({
                isActive,
                isPinned: isActive,
                css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
            });
            // for tutorial
            // addTutorialActive(this.props.geoId + "-hover");
            const prefix = `#${Obj.Segment}-text-`;
            const seg = this.props.geoId.replace("segment.", "");
            const matches = document.querySelectorAll(prefix + seg + ", " + prefix + seg.split("").reverse().join(""));
            matches.forEach((ele) => {
                if (ele) {
                    const cls = [""];
                    if (isActive) {
                        ele.classList.add(...cls);
                    }
                    else {
                        ele.classList.remove(...cls);
                    }
                }
            });
            // logEvent("c", {
            c: "s",
                v;
            this.props.geoId,
            ;
        };
        this.state = {
            isActive: false,
            isPinned: false,
            css: updateStyle(this.props.mode),
        };
    }
    ;
}
;
// deprecated
onHover = (isActive) => {
    if (this.props.hoverable &&
        !this.state.isPinned &&
        isActive !== this.state.isActive) {
        this.setState({
            isActive,
            css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
        });
        // logEvent("h", {
        c: "s",
            v;
        this.props.geoId,
        ;
    }
    ;
};
;
render();
{
    const start = coordsToSvg(this.props.s.p1, this.props.miniScale);
    const end = coordsToSvg(this.props.s.p2, this.props.miniScale);
    const midpt = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    let padding = [0, 0];
    // match rotation of text to be parallel with line
    let unit = vops.unit(vops.sub(start, end));
    // make sure unit vector is within -90 to 90 deg from origin
    if (unit[0] < 0 || unit[1] === -1) {
        unit = vops.smul(unit, -1);
        padding = [0, 0];
    }
    const norm = vops.smul(vops.rot(unit, 90), 17);
    const angleDeg = Math.atan2(unit[1], unit[0]) * (180 / Math.PI);
    return (_jsxs(_Fragment, { children: [_jsx("line", { x1: start[0], x2: end[0], y1: start[1], y2: end[1], id: this.props.geoId, className: this.state.isActive || this.state.isPinned
                    ? this.state.css
                    : updateStyle(this.props.mode), 
                // strokeLinecap={this.props.highlight ? "round" : "butt"}
                strokeLinecap: "round" }, this.props.geoId), _jsx(SVGGeoTick, { parent: this.props.s, tick: this.props.tick, css: this.state.isActive || this.state.isPinned
                    ? this.state.css
                    : updateStyle(this.props.mode), isHighlight: this.props.isHighlight, miniScale: this.props.miniScale, geoId: this.props.geoId })] }));
}
//# sourceMappingURL=SVGGeoSegment.js.map