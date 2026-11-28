import { Arc } from "geometry-object/geometry/Arc";
import React from "react";
import { vops } from "../vectorOps";
import { pops } from "./pathBuilderUtils";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { arcFlags, coordsToSvg, updateStyle } from "./svgUtils";

// this implementation assumes that it is being told what state it should be in for ONE FRAME
export type SVGArcProps = {
  a: Arc;
} & BaseSVGProps;

export class SVGGeoArc extends React.Component<SVGArcProps, BaseSVGState> {
  constructor(props: SVGArcProps) {
    super(props);
    this.state = {
      isActive: false,
      isPinned: false,
      css: updateStyle(this.props.mode),
    };
  }

  render() {
    const { a, miniScale } = this.props;
    const [center, start, end] = [a.center, a.start, a.end].map((v) =>
      coordsToSvg(v.pt, miniScale),
    );
    const avoid =
      this.props.a.opposite && coordsToSvg(this.props.a.opposite.pt, miniScale);
    const radius = vops.mag(vops.sub(start, center));
    const { major, sweep } = arcFlags(center, start, end, avoid);
    return (
      <>
        <path
          d={pops.moveTo(start) + pops.arcTo(radius, major, sweep, end)}
          key={this.props.geoId}
          id={this.props.geoId}
          className={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : updateStyle(this.props.mode)
          }
          strokeLinecap="round"
        />
      </>
    );
  }
}
