import React from "react";
import { logEvent } from "../testinfra/testUtils";
import { LAngle, Obj, SVGModes, TickType } from "../types/types";
import { vops } from "../vectorOps";
import { SVGGeoTick } from "./SVGGeoTick";
import { pops } from "./pathBuilderUtils";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { arcSweepsCCW, coordsToSvg, updateStyle } from "./svgUtils";

export type SVGAngleProps = {
  a: LAngle;
  tick?: { type: TickType; num: number };
} & BaseSVGProps;

export class SVGGeoAngle extends React.Component<SVGAngleProps, BaseSVGState> {
  constructor(props: SVGAngleProps) {
    super(props);
    this.state = {
      isActive: false,
      isPinned: false,
      css: updateStyle(this.props.mode),
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
        css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
      });
      logEvent("h", {
        c: "a",
        v: this.props.a.label,
      });
    }
  };
  // deprecated
  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: updateStyle(isActive ? SVGModes.Derived : this.props.mode),
    });
    const prefix = `#${Obj.Angle}-text-`;
    const ang = this.props.a.label;
    const flippedAng = ang[2] + ang[1] + ang[0];
    const matches = document.querySelectorAll(
      `${prefix + ang}, ${prefix + flippedAng}`
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
    logEvent("h", {
      c: "a",
      v: this.props.a.label,
    });
  };

  angleBbox = () => {
    const sweep = arcSweepsCCW(
      this.props.a.center,
      this.props.a.start,
      this.props.a.end
    );
    const sUnit = vops.unit(vops.sub(this.props.a.start, this.props.a.center));
    const eUnit = vops.unit(vops.sub(this.props.a.end, this.props.a.center));

    const scalar = 0.5;
    let dStr = "";
    const tip = coordsToSvg(this.props.a.center, this.props.miniScale);
    const end = coordsToSvg(
      vops.add(this.props.a.center, vops.smul(eUnit, scalar)),
      this.props.miniScale
    );
    const start = coordsToSvg(
      vops.add(this.props.a.center, vops.smul(sUnit, scalar)),
      this.props.miniScale
    );

    dStr =
      dStr +
      pops.moveTo(tip) +
      pops.lineTo(start) +
      pops.arcTo(scalar, 0, sweep, end) +
      pops.lineTo(tip);
    return dStr;
  };

  render() {
    // calculate angle bisector of angle, rotate along vector and position label
    // angle bisector is unit(u)*v + unit(v)*u
    const u = vops.sub(this.props.a.start, this.props.a.center);
    const v = vops.sub(this.props.a.end, this.props.a.center);
    const bisector = vops.unit(
      vops.add(vops.smul(v, vops.mag(u)), vops.smul(u, vops.mag(v)))
    );
    // make sure unit vector is within -90 to 90 deg from origin
    let angle = -1 * Math.atan2(bisector[1], bisector[0]) * (180 / Math.PI) - 5;
    if (bisector[0] < 0) {
      angle = angle + 180;
    }

    const pos = vops.add(this.props.a.center, vops.smul(bisector, 0.8));
    return (
      <>
        <SVGGeoTick
          parent={this.props.a}
          tick={this.props.tick}
          geoId={this.props.geoId}
          isHighlight={this.props.isHighlight}
          css={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : updateStyle(this.props.mode)
          }
          miniScale={this.props.miniScale}
        />
        {/* {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <HoverTextLabel
            pt={coordsToSvg(pos, this.props.miniScale)}
            rot={angle}
            text={strs.angle + this.props.a.label}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )} */}
        {/* {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <path
            d={this.angleBbox()}
            id={this.props.geoId + "-hover"}
            key={this.props.geoId + "-hover"}
            className={updateStyle(this.props.mode)}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onHoverLabelClick(!this.state.isPinned)}
            style={{
              opacity: 0,
              fill: "red",
              cursor: "pointer",
            }}
          />
        )} */}
      </>
    );
  }
}
