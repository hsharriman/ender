import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { CircularArcSVGProps, SVGObj } from "./svgTypes";

export class SVGCurve extends BaseSVG {
  readonly props: CircularArcSVGProps;
  constructor(props: CircularArcSVGProps) {
    super(props, SVGObj.Curve);
    this.props = props;
  }

  moveTo = (pt: Vector) => {
    return `M ${pt[0]} ${pt[1]} `;
  };

  arcTo = (r: number, major: number, sweep: number, end: Vector) => {
    return `A ${r} ${r} 0 ${major} ${sweep} ${end[0]} ${end[1]}`;
  };

  override renderSVG = () => {
    const pathStr =
      this.moveTo(this.props.start) +
      this.arcTo(
        this.props.r,
        this.props.majorArc,
        this.props.sweep,
        this.props.end
      );
    return <path d={pathStr} id={this.key} style={this.style} key={this.key} />;
  };
}
