import React from "react";
import { Vector } from "../types/types";
import { BaseSVG } from "./BaseSVG";
import { LineSVGProps } from "./svgTypes";

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
    return (
      <>
        <line
          x1={this.start[0]}
          x2={this.end[0]}
          y1={this.start[1]}
          y2={this.end[1]}
          key={this.geoId}
          id={this.geoId}
          className={this.updateStyle(this.props.mode)}
        />
      </>
    );
  }
}
