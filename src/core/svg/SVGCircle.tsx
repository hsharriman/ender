import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { CircleSVGProps } from "./svgTypes";

export class SVGCircle extends BaseSVG {
  private center: Vector;
  private r: number;
  constructor(props: CircleSVGProps) {
    super(props);
    this.center = props.center;
    this.r = props.r;
  }

  render() {
    return (
      <circle
        cx={this.center[0]}
        cy={this.center[1]}
        r={this.r}
        id={this.geoId}
        key={this.geoId}
        className={this.updateStyle(this.props.mode)}
      />
    );
  }
}