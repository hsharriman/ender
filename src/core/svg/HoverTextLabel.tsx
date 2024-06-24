import React from "react";
import { Vector } from "../types/types";

export interface HoverTextLabelProps {
  pt: Vector;
  rot: number;
  text: string;
  isHovered: boolean;
  isPinned: boolean;
}

export class HoverTextLabel extends React.Component<HoverTextLabelProps, {}> {
  private defaultCSS =
    "ease-out duration-300 fill-violet-500 text-violet-500 select-none";

  getClassName = () => {
    if (this.props.isHovered || this.props.isPinned) {
      return (
        this.defaultCSS +
        " opacity-100 cursor-pointer pointer-events-auto cursor-default"
      );
    } else {
      return (
        this.defaultCSS +
        " opacity-0 pointer-events-auto delay-700 cursor-default"
      );
    }
  };
  render() {
    return (
      <text
        textAnchor="middle"
        transform={`translate(${this.props.pt[0]},${this.props.pt[1]}) rotate(${this.props.rot})`}
        className={this.getClassName()}
        key={this.props.text + "-label"}
      >
        {this.props.text}
      </text>
    );
  }
}
