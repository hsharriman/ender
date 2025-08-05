import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
// import { logEvent } from "../testinfra/testUtils";
import { Obj, SVGModes } from "../types/types";
import { coordsToSvg, updateStyle } from "./svgUtils";
export class SVGGeoPoint extends React.Component {
    constructor(props) {
        super(props);
        // deprecated
        this.onTextClick = () => {
            const pin = !this.state.isPinned === true;
            this.setState({
                isPinned: pin,
                css: pin ? updateStyle(SVGModes.Default) : "",
            });
            const matches = document.querySelectorAll(`#${Obj.Point}-text-${this.props.geoId.replace("point.", "")}`);
            matches.forEach((ele) => {
                if (ele) {
                    const cls = [""];
                    if (pin) {
                        ele.classList.add(...cls);
                    }
                    else {
                        ele.classList.remove(...cls);
                    }
                }
            });
            // logEvent("c", {
            c: "po",
                v;
            this.props.label,
            ;
        };
        this.showLabel = props.showLabel ?? true;
        this.state = {
            isActive: false,
            css: "",
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
            css: isActive ? updateStyle(SVGModes.Default) : "",
        });
        // logEvent("h", {
        c: "po",
            v;
        this.props.label,
        ;
    }
    ;
};
;
render();
{
    const point = coordsToSvg(this.props.p.pt, this.props.miniScale);
    const labelPoint = coordsToSvg(this.props.p.pt, this.props.miniScale, this.props.offset);
    return (_jsxs(_Fragment, { children: [this.props.showPoint !== ShowPoint.Hide && (_jsx("circle", { cx: point[0], cy: point[1], r: this.props.showPoint === ShowPoint.Adaptive ? 5 : 3, id: this.props.geoId + "-circle", className: this.props.showPoint === ShowPoint.Adaptive
                    ? updateStyle(this.props.mode, true)
                    : "fill-black opacity-1" }, this.props.geoId + "-circle")), _jsx("text", { x: labelPoint[0], y: labelPoint[1], id: this.props.geoId, style: {
                    font: "18px serif",
                    fontStyle: "italic",
                }, className: this.state.isActive ? this.state.css : "", children: this.props.label }, this.props.geoId), this.props.hoverable && (_jsx("text", { x: point[0], y: point[1], id: this.props.geoId + "-hover", style: { opacity: 0, color: "red", cursor: "pointer" }, onPointerEnter: () => this.onHover(true), onPointerLeave: () => this.onHover(false), onClick: () => this.onTextClick(), className: "text-xl", children: this.props.label }, this.props.geoId + "-hover"))] }));
}
//# sourceMappingURL=SVGGeoPoint.js.map