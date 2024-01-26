import React from "react";
import { CircleSVGProps, Vector } from "../../core/types";
import { BaseSVGObject } from "./BasicSVGObject";

export class SVGCircle extends BaseSVGObject {
  readonly center: Vector;
  readonly r: number;
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
        key={this.key}
        style={this.state.style}
      />
    );
  }
}
