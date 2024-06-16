import React from "react";
import { Vector } from "../types/types";

export interface HoverTextLabelProps {
  pt: Vector;
  rot: number;
  text: string;
  isHovered: boolean;
  clickedCallback: (isClicked: boolean) => void;
}

interface LabelTextState {
  isClicked: boolean;
}
export class HoverTextLabel extends React.Component<
  HoverTextLabelProps,
  LabelTextState
> {
  private defaultCSS = "ease-out duration-300 fill-violet-500 text-violet-500";
  constructor(props: HoverTextLabelProps) {
    super(props);
    this.state = {
      isClicked: false,
    };
  }
  getClassName = () => {
    if (this.state.isClicked || this.props.isHovered) {
      return (
        this.defaultCSS +
        " opacity-100 cursor-pointer pointer-events-auto cursor-pointer"
      );
    } else if (!this.props.isHovered) {
      return (
        this.defaultCSS +
        " opacity-0 pointer-events-auto delay-700 cursor-pointer"
      );
    } else {
      return this.defaultCSS + " opacity-0 pointer-events-none";
    }
  };
  onClick = () => {
    this.props.clickedCallback(!this.state.isClicked);
    this.setState({ isClicked: !this.state.isClicked });
  };
  render() {
    return (
      <text
        textAnchor="middle"
        transform={`translate(${this.props.pt[0]},${this.props.pt[1]}) rotate(${this.props.rot})`}
        className={this.getClassName()}
        onClick={() => this.onClick()} // TODO
        key={this.props.text + "-label"}
      >
        {this.props.text}
      </text>
    );
  }
}
