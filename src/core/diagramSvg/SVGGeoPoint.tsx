import React from "react";
import { ShowPoint } from "../geometry/Point";
import { logEvent } from "../testinfra/testUtils";
import { LPoint, Obj, SVGModes, Vector } from "../types/types";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";

export type SVGPointProps = {
  p: LPoint;
  offset: Vector;
  label: string;
  showLabel?: boolean;
  showPoint: ShowPoint;
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

  // deprecated
  onTextClick = () => {
    const pin = !this.state.isPinned === true;
    this.setState({
      isPinned: pin,
      css: pin ? updateStyle(SVGModes.Default) : "",
    });
    const matches = document.querySelectorAll(
      `#${Obj.Point}-text-${this.props.geoId.replace("point.", "")}`
    );
    matches.forEach((ele) => {
      if (ele) {
        const cls = [""];
        if (pin) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    });
    logEvent("c", {
      c: "po",
      v: this.props.label,
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
        css: isActive ? updateStyle(SVGModes.Default) : "",
      });
      logEvent("h", {
        c: "po",
        v: this.props.label,
      });
    }
  };

  render() {
    const point = coordsToSvg(this.props.p.pt, this.props.miniScale);
    const labelPoint = coordsToSvg(
      this.props.p.pt,
      this.props.miniScale,
      this.props.offset
    );
    return (
      <>
        {this.props.showPoint !== ShowPoint.Hide && (
          <circle
            cx={point[0]}
            cy={point[1]}
            r={this.props.showPoint === ShowPoint.Adaptive ? 5 : 3}
            id={this.props.geoId + "-circle"}
            key={this.props.geoId + "-circle"}
            className={
              this.props.showPoint === ShowPoint.Adaptive
                ? updateStyle(this.props.mode, true)
                : "fill-black opacity-1"
            }
          />
        )}
        <text
          x={labelPoint[0]}
          y={labelPoint[1]}
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
