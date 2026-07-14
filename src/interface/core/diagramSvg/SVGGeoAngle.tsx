import { LAngle, Obj } from "geometry-object";
import React from "react";
import { SVGModes, TickType } from "../types/diagramTypes";
import { vops } from "../vectorOps";
import { SVGGeoTick } from "./SVGGeoTick";
import { pops } from "./pathBuilderUtils";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { arcSweepsCCW, coordsToSvg, scaleToSvg, updateStyle } from "./svgUtils";

const GRADIENT_ARC_R = 1.0;
const GRADIENT_MINI_ARC_R = 2.0;
const DERIVED_BLUE = "#3b82f6";
const RELIES_BLACK = "#000000";

export type SVGAngleProps = {
  a: LAngle;
  tick?: { type: TickType; num: number };
  gradientMode?: SVGModes;
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
      `${prefix + ang}, ${prefix + flippedAng}`,
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

  angleBbox = () => {
    const sweep = arcSweepsCCW(
      this.props.a.center,
      this.props.a.start,
      this.props.a.end,
    );
    const sUnit = vops.unit(vops.sub(this.props.a.start, this.props.a.center));
    const eUnit = vops.unit(vops.sub(this.props.a.end, this.props.a.center));

    const scalar = 0.5;
    let dStr = "";
    const tip = coordsToSvg(this.props.a.center, this.props.miniScale);
    const end = coordsToSvg(
      vops.add(this.props.a.center, vops.smul(eUnit, scalar)),
      this.props.miniScale,
    );
    const start = coordsToSvg(
      vops.add(this.props.a.center, vops.smul(sUnit, scalar)),
      this.props.miniScale,
    );

    dStr =
      dStr +
      pops.moveTo(tip) +
      pops.lineTo(start) +
      pops.arcTo(scalar, 0, sweep, end) +
      pops.lineTo(tip);
    return dStr;
  };

  renderGradient = () => {
    const { a, gradientMode, miniScale, geoId } = this.props;
    if (gradientMode === undefined) return null;
    const gradientColor =
      gradientMode === SVGModes.ReliesOn ? RELIES_BLACK : DERIVED_BLUE;

    const gradId = `angle-grad-${geoId}`;
    const arcR = miniScale ? GRADIENT_MINI_ARC_R : GRADIENT_ARC_R;
    const rSvg = scaleToSvg(arcR, miniScale);

    const sweep = arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    const center = coordsToSvg(a.center, miniScale);
    const arcStart = coordsToSvg(
      vops.add(a.center, vops.smul(sUnit, arcR)),
      miniScale,
    );
    const arcEnd = coordsToSvg(
      vops.add(a.center, vops.smul(eUnit, arcR)),
      miniScale,
    );

    const sectorPath =
      pops.moveTo(center) +
      pops.lineTo(arcStart) +
      pops.arcTo(rSvg, 0, sweep, arcEnd) +
      pops.closePath();

    return (
      <>
        <defs>
          <radialGradient
            id={gradId}
            cx={center[0]}
            cy={center[1]}
            r={rSvg}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={gradientColor} stopOpacity={0} />
            <stop offset="75%" stopColor={gradientColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={0.1} />
          </radialGradient>
        </defs>
        <path
          d={sectorPath}
          id={`${gradId}-fill`}
          style={{ fill: `url(#${gradId})`, stroke: "none" }}
        />
      </>
    );
  };

  render() {
    // calculate angle bisector of angle, rotate along vector and position label
    // angle bisector is unit(u)*v + unit(v)*u
    const u = vops.sub(this.props.a.start, this.props.a.center);
    const v = vops.sub(this.props.a.end, this.props.a.center);
    const bisector = vops.unit(
      vops.add(vops.smul(v, vops.mag(u)), vops.smul(u, vops.mag(v))),
    );
    // make sure unit vector is within -90 to 90 deg from origin
    let angle = -1 * Math.atan2(bisector[1], bisector[0]) * (180 / Math.PI) - 5;
    if (bisector[0] < 0) {
      angle = angle + 180;
    }

    const pos = vops.add(this.props.a.center, vops.smul(bisector, 0.8));
    return (
      <>
        {this.renderGradient()}
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
