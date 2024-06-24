import React from "react";
import { LSegment, Obj, SVGModes, TickType, Vector } from "../../types/types";
import { vops } from "../../vectorOps";
import { BaseSVGState } from "../BaseSVG";
import { HoverTextLabel } from "../HoverTextLabel";
import { ModeCSS } from "../SVGStyles";
import { BaseSVGProps } from "../svgTypes";
import { coordsToSvg, updateStyle } from "../svgUtils";
import { SVGGeometryTick } from "./SVGGeometryTick";

// this implementation assumes that it is being told what state it should be in for ONE FRAME
export type SVGSegmentProps = {
  s: LSegment;
  miniScale: boolean;
  tick?: { type: TickType; num: number };
} & BaseSVGProps;

export class SVGGeometrySegment extends React.Component<
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

  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: updateStyle(isActive ? SVGModes.Pinned : this.props.mode),
    });
    const prefix = `#${Obj.Segment}-text-`;
    const seg = this.props.geoId.replace("segment.", "");
    const matches = document.querySelectorAll(
      prefix + seg + ", " + prefix + seg.split("").reverse().join("") // TODO delete when all segments are alphabetical
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

  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: updateStyle(isActive ? SVGModes.Active : this.props.mode),
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
    if (unit[0] < 0) {
      unit = vops.smul(unit, -1);
      padding = [0, 0];
    }
    const norm = vops.smul(vops.rot(unit, 90), 20);
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
        />
        <SVGGeometryTick
          parent={this.props.s}
          tick={this.props.tick}
          css={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : updateStyle(this.props.mode)
          }
          miniScale={this.props.miniScale}
          geoId={this.props.geoId + "-tick"} // TODO make this discoverable from linkedtext
        />
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <HoverTextLabel
            pt={vops.add(midpt, norm)}
            rot={angleDeg}
            text={this.props.geoId.replace("segment.", "")}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )}
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
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
              opacity: 0.1,
              stroke: "green",
              strokeWidth: 18,
              cursor: "pointer",
            }}
          />
        )}
      </>
    );
  }
}
