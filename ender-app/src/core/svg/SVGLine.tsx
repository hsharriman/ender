import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { LineSVGProps, SVGObj } from "./svgTypes";

export class SVGLine extends BaseSVG {
  private start: Vector;
  private end: Vector;
  constructor(props: LineSVGProps) {
    super(props);
    const { start, end } = props;
    this.start = start;
    this.end = end;
  }

  render() {
    let elem = (
      <line
        x1={this.start[0]}
        x2={this.end[0]}
        y1={this.start[1]}
        y2={this.end[1]}
        key={this.key}
        id={this.key}
        style={this.updateStyle()}
        // onMouseOver={} // TODO
        // onMouseOut={}  // TODO
      />
    );
    return elem;
  }
}
