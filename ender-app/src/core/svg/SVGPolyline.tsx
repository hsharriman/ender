import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { PolylineSVGProps, SVGObj } from "./svgTypes";

export class SVGPolyline extends BaseSVG {
  readonly points: Vector[];
  constructor(props: PolylineSVGProps) {
    super(props);
    this.points = props.points;
  }

  private polylinePathFromPts = (pts: Vector[]) => {
    let pointsStr = "";
    pts.forEach((v) => {
      pointsStr = pointsStr + `${v[0]},${v[1]} `;
    });
    return pointsStr;
  };

  render() {
    return (
      <polyline
        points={this.polylinePathFromPts(this.points)}
        id={this.geoId}
        key={this.geoId}
        className={this.updateStyle(this.props.mode)}
      />
    );
  }
}
