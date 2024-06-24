import React from "react";
import { Triangle } from "../geometry/Triangle";
import { strs } from "../geometryText";
import { Obj } from "../types/types";
import { vops } from "../vectorOps";
import { HoverTextLabel } from "./HoverTextLabel";
import { ModeCSS } from "./SVGStyles";
import { pops } from "./pathBuilderUtils";
import { BaseSVGState } from "./svgTypes";
import { coordsToSvg } from "./svgUtils";

export interface SVGTriangleProps {
  t: Triangle;
  geoId: string;
  hoverable?: boolean;
  miniScale: boolean;
}

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
    console.log("Triangle", this.props.t.label);
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
    const ang = this.props.t.label;
    const flippedAng = ang[2] + ang[1] + ang[0];
    const matches = document.querySelectorAll(
      `${prefix + ang}, ${prefix + flippedAng}`
    );
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
    return (
      <>
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
              opacity: 0.1,
              fill: "blue",
              cursor: "pointer",
            }}
          />
        )}
      </>
    );
  }
}
