import React from "react";
import { Triangle } from "../geometry/Triangle";
import { strs } from "../geometryText";
import { Obj } from "../types/types";
import { logEvent, permutator } from "../utils";
import { vops } from "../vectorOps";
import { HoverTextLabel } from "./HoverTextLabel";
import { ModeCSS } from "./SVGStyles";
import { pops } from "./pathBuilderUtils";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";

export type SVGTriangleProps = {
  t: Triangle;
  backgroundColor: string;
} & BaseSVGProps;

export class SVGGeoTriangle extends React.Component<
  SVGTriangleProps,
  BaseSVGState
> {
  constructor(props: SVGTriangleProps) {
    super(props);
    this.state = {
      isActive: false,
      isPinned: false,
      css: "",
    };
  }
  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
      });
      logEvent("h", {
        c: "t",
        v: this.props.geoId,
      });
    }
  };

  highlightElems = (isActive: boolean) => {
    const a = this.props.t.a;
    const s = this.props.t.s;
    s.map((seg) => {
      seg.onClickText(isActive);
    });
    a.map((ang) => {
      ang.onClickText(isActive);
    });
  };

  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
    });
    // TODO find matches for all segments/angles and add to their class
    const prefix = `#${Obj.Triangle}-text-`;
    const tri = this.props.t.label;
    const selectors = permutator(tri.split(""))
      .map((p) => prefix + p)
      .join(", ");
    const matches = document.querySelectorAll(selectors);
    matches.forEach((ele) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMCLICKTEXT.split(" ");
        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    });
    logEvent("c", {
      c: "t",
      v: this.props.geoId,
    });
  };

  triangleBbox = () => {
    const [p1, p2, p3] = this.props.t.p;
    const a = coordsToSvg(p1.pt, this.props.miniScale);
    const b = coordsToSvg(p2.pt, this.props.miniScale);
    const c = coordsToSvg(p3.pt, this.props.miniScale);

    const dStr =
      pops.moveTo(a) + pops.lineTo(b) + pops.lineTo(c) + pops.closePath();
    return dStr;
  };

  render() {
    // calculate center of triangle
    const [p1, p2, p3] = this.props.t.p;
    // centroid is at 1/3(u+v+w)
    const center = vops.smul(vops.add(vops.add(p1.pt, p2.pt), p3.pt), 1 / 3);
    const triStyle = updateStyle(this.props.mode);
    return (
      <>
        {this.props.backgroundColor && triStyle.includes("fill-triangle") && (
          <path
            d={this.triangleBbox()}
            id={this.props.geoId + "-bg"}
            key={this.props.geoId + "-bg"}
            style={{
              opacity: triStyle.includes("half-opacity") ? 0.2 : 0.5,
              fill: this.props.backgroundColor,
            }}
          />
        )}
        {this.props.hoverable && (
          <HoverTextLabel
            pt={coordsToSvg(center, this.props.miniScale)}
            rot={0}
            text={strs.triangle + this.props.t.label}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )}
        {this.props.hoverable && (
          <path
            d={this.triangleBbox()}
            id={this.props.geoId + "-hover"}
            key={this.props.geoId + "-hover"}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onHoverLabelClick(!this.state.isPinned)}
            style={{
              opacity: 0,
              fill: "blue",
              cursor: "pointer",
            }}
          />
        )}
      </>
    );
  }
}
