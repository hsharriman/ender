import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
// import { logEvent } from "../testinfra/testUtils";
import { Obj, SVGModes } from "../types/types";
import { vops } from "../vectorOps";
import { pops } from "./pathBuilderUtils";
import { arcSweepsCCW, coordsToSvg, updateStyle } from "./svgUtils";
export class SVGGeoAngle extends React.Component {
    constructor(props) {
        super(props);
        this.onHover = (isActive) => {
            if (this.props.hoverable &&
                !this.state.isPinned &&
                isActive !== this.state.isActive) {
                this.setState({
                    isActive,
                    css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
                });
                // logEvent("h", {
                c: "a",
                    v;
                this.props.a.label,
                ;
            }
            ;
        };
        this.state = {
            isActive: false,
            isPinned: false,
            css: updateStyle(this.props.mode),
        };
    }
}
;
// deprecated
onHoverLabelClick = (isActive) => {
    this.setState({
        isActive,
        isPinned: isActive,
        css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
    });
    const prefix = `#${Obj.Angle}-text-`;
    const ang = this.props.a.label;
    const flippedAng = ang[2] + ang[1] + ang[0];
    const matches = document.querySelectorAll(`${prefix + ang}, ${prefix + flippedAng}`);
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
    // logEvent("h", {
    c: "a",
        v;
    this.props.a.label,
    ;
};
;
;
angleBbox = () => {
    const sweep = arcSweepsCCW(this.props.a.center, this.props.a.start, this.props.a.end);
    const sUnit = vops.unit(vops.sub(this.props.a.start, this.props.a.center));
    const eUnit = vops.unit(vops.sub(this.props.a.end, this.props.a.center));
    const scalar = 0.5;
    let dStr = "";
    const tip = coordsToSvg(this.props.a.center, this.props.miniScale);
    const end = coordsToSvg(vops.add(this.props.a.center, vops.smul(eUnit, scalar)), this.props.miniScale);
    const start = coordsToSvg(vops.add(this.props.a.center, vops.smul(sUnit, scalar)), this.props.miniScale);
    dStr =
        dStr +
            pops.moveTo(tip) +
            pops.lineTo(start) +
            pops.arcTo(scalar, 0, sweep, end) +
            pops.lineTo(tip);
    return dStr;
};
render();
{
    // calculate angle bisector of angle, rotate along vector and position label
    // angle bisector is unit(u)*v + unit(v)*u
    const u = vops.sub(this.props.a.start, this.props.a.center);
    const v = vops.sub(this.props.a.end, this.props.a.center);
    const bisector = vops.unit(vops.add(vops.smul(v, vops.mag(u)), vops.smul(u, vops.mag(v))));
    // make sure unit vector is within -90 to 90 deg from origin
    let angle = -1 * Math.atan2(bisector[1], bisector[0]) * (180 / Math.PI) - 5;
    if (bisector[0] < 0) {
        angle = angle + 180;
    }
    const pos = vops.add(this.props.a.center, vops.smul(bisector, 0.8));
    return (_jsx(_Fragment, { children: _jsx(SVGGeoTick, { parent: this.props.a, tick: this.props.tick, geoId: this.props.geoId, isHighlight: this.props.isHighlight, css: this.state.isActive || this.state.isPinned
                ? this.state.css
                : updateStyle(this.props.mode), miniScale: this.props.miniScale }) }));
}
//# sourceMappingURL=SVGGeoAngle.js.map