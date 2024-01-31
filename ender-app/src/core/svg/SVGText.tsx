import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { TextSVGProps, SVGObj } from "./svgTypes";

export class SVGText extends BaseSVG {
  private text: string;
  private point: Vector;
  constructor(props: TextSVGProps) {
    super(props, SVGObj.Text);
    const { text, point } = props;
    this.text = text;
    this.point = point;
  }

  override renderSVG = () => {
    return (
      <text
        x={this.point[0]}
        y={this.point[1]}
        key={this.key}
        style={this.style}
      >
        {this.text}
      </text>
    );
  };
}
