import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { CircleSVGProps, SVGObj } from "./svgTypes";

export class SVGCircle extends BaseSVG {
  private center: Vector;
  private r: number;
  constructor(props: CircleSVGProps) {
    super(props, SVGObj.Circle);
    const { center, r } = props;
    this.center = center;
    this.r = r;
  }

  override renderSVG = () => {
    return (
      <circle
        cx={this.center[0]}
        cy={this.center[1]}
        r={this.r}
        key={this.key}
        style={this.style}
      />
    );
  };
}
