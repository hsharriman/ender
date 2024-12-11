import React from "react";
import { addTutorialActive, logEvent } from "../testinfra/testUtils";
import { LSegment, Obj, SVGModes, TickType, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { SVGGeoTick } from "./SVGGeoTick";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";

// this implementation assumes that it is being told what state it should be in for ONE FRAME
export type SVGSegmentProps = {
  s: LSegment;
  tick?: { type: TickType; num: number };
} & BaseSVGProps;

export class SVGGeoSegment extends React.Component<
  SVGSegmentProps,
  BaseSVGState
> {
  constructor(props: SVGSegmentProps) {
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
    // for tutorial
    addTutorialActive(this.props.geoId + "-hover");

    const prefix = `#${Obj.Segment}-text-`;
    const seg = this.props.geoId.replace("segment.", "");
    const matches = document.querySelectorAll(
      prefix + seg + ", " + prefix + seg.split("").reverse().join("")
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

    logEvent("c", {
      c: "s",
      v: this.props.geoId,
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

      logEvent("h", {
        c: "s",
        v: this.props.geoId,
      });
    }
  };

  render() {
    const start = coordsToSvg(this.props.s.p1, this.props.miniScale);
    const end = coordsToSvg(this.props.s.p2, this.props.miniScale);
    const midpt: Vector = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
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
    return (
      <>
        <line
          x1={start[0]}
          x2={end[0]}
          y1={start[1]}
          y2={end[1]}
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
        <SVGGeoTick
          parent={this.props.s}
          tick={this.props.tick}
          css={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : updateStyle(this.props.mode)
          }
          isHighlight={this.props.isHighlight}
          miniScale={this.props.miniScale}
          geoId={this.props.geoId}
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
