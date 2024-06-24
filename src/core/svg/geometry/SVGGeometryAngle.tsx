import React from "react";
import { LAngle, Obj, SVGModes, TickType } from "../../types/types";
import { vops } from "../../vectorOps";
import { BaseSVG, BaseSVGState } from "../BaseSVG";
import { HoverTextLabel } from "../HoverTextLabel";
import { ModeCSS } from "../SVGStyles";
import { pops } from "../pathBuilderUtils";
import { BaseSVGProps } from "../svgTypes";
import { arcSweepsCCW, coordsToSvg, updateStyle } from "../svgUtils";
import { SVGGeometryTick } from "./SVGGeometryTick";
import { strs } from "../../geometryText";

export type SVGAngleProps = {
  a: LAngle;
  tick?: { type: TickType; num: number };
  miniScale: boolean;
} & BaseSVGProps;

export class SVGGeometryAngle extends React.Component<
  SVGAngleProps,
  BaseSVGState
> {
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: SVGAngleProps) {
    super(props);
    this.wrapperRef = React.createRef<HTMLDivElement>();
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
        css: updateStyle(isActive ? SVGModes.Active : this.props.mode),
      });
    }
  };
  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: updateStyle(isActive ? SVGModes.Pinned : this.props.mode),
    });
    const prefix = `#${Obj.Angle}-text-`;
    const ang = this.props.a.label;
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
    if (this.props.tick) {
      console.log(this.props.tick, this.props.mode, this.props.a.label);
    }
    return (
      <>
        <SVGGeometryTick
          parent={this.props.a}
          tick={this.props.tick}
          css={this.state.css} // TODO must match css i think
          miniScale={this.props.miniScale}
          geoId={this.props.geoId + "-tick"} // TODO make this discoverable from linkedtext
        />
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <HoverTextLabel
            pt={coordsToSvg(this.props.a.center, this.props.miniScale)}
            rot={0}
            text={strs.angle + this.props.a.label}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )}
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <path
            d={this.angleBbox()}
            id={this.props.geoId + "-hover"}
            key={this.props.geoId + "-hover"}
            className={updateStyle(this.props.mode)}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onHoverLabelClick(!this.state.isPinned)}
            style={{
              opacity: 0.1,
              fill: "red",
              cursor: "pointer",
            }}
          />
        )}
      </>
    );
  }
}
