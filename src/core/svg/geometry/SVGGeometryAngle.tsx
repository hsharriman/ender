import React from "react";
import { LAngle, Obj, SVGModes, TickType } from "../../types/types";
import { vops } from "../../vectorOps";
import { BaseSVG } from "../BaseSVG";
import { HoverTextLabel } from "../HoverTextLabel";
import { ModeCSS } from "../SVGStyles";
import { pops } from "../pathBuilderUtils";
import { BaseSVGProps } from "../svgTypes";
import { arcSweepsCCW, coordsToSvg } from "../svgUtils";
import { SVGGeometryTick } from "./SVGGeometryTick";

export type SVGAngleProps = {
  a: LAngle;
  tick?: { type: TickType; num: number };
  miniScale: boolean;
} & BaseSVGProps;

export class SVGGeometryAngle extends BaseSVG {
  private a: LAngle;
  private miniScale: boolean;
  private tick?: { type: TickType; num: number };
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: SVGAngleProps) {
    super(props);
    this.wrapperRef = React.createRef<HTMLDivElement>();
    this.a = props.a;
    this.miniScale = props.miniScale;
    this.tick = props.tick;
  }
  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: this.updateStyle(isActive ? SVGModes.Active : this.props.mode),
      });
    }
  };
  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: this.updateStyle(isActive ? SVGModes.Pinned : this.props.mode),
    });
    const prefix = `#${Obj.Angle}-text-`;
    const ang = this.props.geoId.replace("angle.", "");
    const matches = document.querySelectorAll(prefix + ang);
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
    const sweep = arcSweepsCCW(this.a.center, this.a.start, this.a.end);
    const sUnit = vops.unit(vops.sub(this.a.start, this.a.center));
    const eUnit = vops.unit(vops.sub(this.a.end, this.a.center));

    const scalar = 18;
    let dStr = "";
    dStr = dStr + pops.moveTo(coordsToSvg(this.a.center, this.miniScale));
    const end = coordsToSvg(
      vops.add(this.a.center, vops.smul(eUnit, scalar)),
      this.miniScale
    );
    const start = coordsToSvg(
      vops.add(this.a.center, vops.smul(sUnit, scalar)),
      this.miniScale
    );
    dStr = dStr + pops.lineTo(start);
    dStr = dStr + pops.moveTo(start) + pops.arcTo(scalar, 0, sweep, end);
    dStr = dStr + pops.moveTo(end);

    return dStr;
  };

  render() {
    return (
      <>
        {this.tick && (
          <SVGGeometryTick
            parent={this.a}
            type={this.tick.type}
            mode={this.props.mode} // TODO must match css i think
            num={this.tick.num}
            miniScale={this.miniScale}
            geoId={this.props.geoId + "-tick"} // TODO make this discoverable from linkedtext
          />
        )}
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <HoverTextLabel
            pt={this.a.center}
            rot={0}
            text={"<" + this.props.geoId.replace("angle.", "")}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )}
        {this.props.hoverable && this.props.mode !== SVGModes.Hidden && (
          <path
            d={this.angleBbox()}
            id={this.geoId + "-hover"}
            key={this.geoId + "-hover"}
            className={this.updateStyle(this.props.mode)}
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
