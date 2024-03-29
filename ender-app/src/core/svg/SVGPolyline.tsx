import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { PolylineSVGProps, SVGObj } from "./svgTypes";

export class SVGPolyline extends BaseSVG {
  readonly points: Vector[];
  constructor(props: PolylineSVGProps) {
    super(props, SVGObj.Polyline);
    this.points = props.points;
  }

  private polylinePathFromPts = (pts: Vector[]) => {
    let pointsStr = "";
    pts.forEach((v) => {
      pointsStr = pointsStr + `${v[0]},${v[1]} `;
    });
    return pointsStr;
  };

  override renderSVG = () => {
    return (
      <polyline
        points={this.polylinePathFromPts(this.points)}
        id={this.key}
        key={this.key}
        style={this.style}
      />
    );
  };
}
