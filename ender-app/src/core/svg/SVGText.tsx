import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { TextSVGProps, SVGObj } from "./svgTypes";

export class SVGText extends BaseSVG {
  private text: string;
  private point: Vector;
  constructor(props: TextSVGProps) {
    super(props);
    const { text, point } = props;
    this.text = text;
    this.point = point;
  }

  render() {
    return (
      <text
        x={this.point[0]}
        y={this.point[1]}
        id={this.key}
        key={this.key}
        style={this.style}
      >
        {this.text}
      </text>
    );
  }
}
