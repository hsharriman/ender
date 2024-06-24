import React from "react";
import { LPoint, Obj, SVGModes, Vector } from "../types/types";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";
import { ModeCSS } from "./SVGStyles";

export type SVGPointProps = {
  p: LPoint;
  offset: Vector;
  label: string;
  showLabel?: boolean;
  miniScale: boolean;
} & BaseSVGProps;

export class SVGGeoPoint extends React.Component<SVGPointProps, BaseSVGState> {
  showLabel: boolean;
  constructor(props: SVGPointProps) {
    super(props);
    this.showLabel = props.showLabel ?? true;
    this.state = {
      isActive: false,
      css: "",
    };
  }

  onTextClick = () => {
    const pin = !this.state.isPinned === true;
    this.setState({
      isPinned: pin,
      css: pin ? updateStyle(SVGModes.ActiveText) : "",
    });
    const matches = document.querySelectorAll(
      `#${Obj.Point}-text-${this.props.geoId.replace("point.", "")}`
    );
    matches.forEach((ele) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMCLICKTEXT.split(" ");
        if (pin) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    });
  };

  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: isActive ? updateStyle(SVGModes.ActiveText) : "",
      });
    }
  };

  render() {
    const point = coordsToSvg(
      this.props.p.pt,
      this.props.miniScale,
      this.props.offset
    );
    return (
      <>
        // TODO fix point rendering
        {/* <SVGCircle
          {...{
            center: coordsToSvg(this.p.pt, this.miniScale),
            r: 2,
            geoId: this.geoId + "-circle",
            mode: this.props.mode, // TODO unnecessary rn
            activeFrame: "",
          }}
        /> */}
        <text
          x={point[0]}
          y={point[1]}
          id={this.props.geoId}
          key={this.props.geoId}
          style={{
            font: "18px serif",
            fontStyle: "italic",
          }}
          className={this.state.isActive ? this.state.css : ""}
        >
          {this.props.label}
        </text>
        {this.props.hoverable && (
          <text
            x={point[0]}
            y={point[1]}
            id={this.props.geoId + "-hover"}
            key={this.props.geoId + "-hover"}
            style={{ opacity: 0, color: "red", cursor: "pointer" }}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onTextClick()}
            className="text-xl"
          >
            {this.props.label}
          </text>
        )}
      </>
    );
  }
}
