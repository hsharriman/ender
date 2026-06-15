import { LCircle, Obj } from "geometry-object";
import React from "react";
import { SVGModes } from "../types/diagramTypes";
import { vops } from "../vectorOps";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";

// this implementation assumes that it is being told what state it should be in for ONE FRAME
export type SVGCircleProps = {
  c: LCircle;
} & BaseSVGProps;

export class SVGGeoCircle extends React.Component<
  SVGCircleProps,
  BaseSVGState
> {
  constructor(props: SVGCircleProps) {
    super(props);
    this.state = {
      isActive: false,
      isPinned: false,
      css: updateStyle(this.props.mode),
    };
  }

  // deprecated
  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
    });

    const prefix = `#${Obj.Circle}-text-`;
    const circle = this.props.geoId.replace("circle.", "");
    const matches = document.querySelectorAll(
      prefix + circle + ", " + prefix + circle.split("").reverse().join(""),
    );
    matches.forEach((ele) => {
      if (ele) {
        const cls = [""];
        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    });
  };

  // deprecated
  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
      });
    }
  };

  render() {
    const center = coordsToSvg(this.props.c.center, this.props.miniScale);
    const end = coordsToSvg(this.props.c.radius, this.props.miniScale);
    const radius = vops.mag(vops.sub(end, center));
    return (
      <>
        <circle
          cx={center[0]}
          cy={center[1]}
          r={radius}
          key={this.props.geoId}
          id={this.props.geoId}
          className={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : updateStyle(this.props.mode)
          }
          // strokeLinecap={this.props.highlight ? "round" : "butt"}
          strokeLinecap="round"
        />
        {/* {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <HoverTextLabel
            pt={vops.add(midpt, norm)}
            rot={angleDeg}
            text={this.props.geoId.replace("segment.", "")}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )} */}
        {/* {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <line
            x1={start[0]}
            x2={end[0]}
            y1={start[1]}
            y2={end[1]}
            key={this.props.geoId + "-hover"}
            id={this.props.geoId + "-hover"}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onHoverLabelClick(!this.state.isPinned)}
            style={{
              opacity: 0,
              stroke: "green",
              strokeWidth: 18,
              cursor: "pointer",
            }}
          />
        )} */}
      </>
    );
  }
}
