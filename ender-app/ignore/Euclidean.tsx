import React from "react";
import { BaseSVG } from "../src/core/svg/BaseSVG";

export interface EuclideanProps {
  svgIdSuffix: number;
  content: JSX.Element[];
  activeFrame: string;
}

interface EuclideanState {
  activeFrame: string;
}

export class Euclidean extends React.Component<EuclideanProps, EuclideanState> {
  private svgId: string;
  private svgContent: JSX.Element[];

  // TODO
  // euclidean needs to render a list of all BaseSVG objects that will
  // ever appear in the construction. It needs state to track
  // when each object should be rendered as well
  // it needs to remember what state each object should be at each frame
  // each object should have its own render function that updates
  // based on the following states: focused, unfocus, hidden, active, default
  constructor(props: EuclideanProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
    this.svgContent = props.content;
    this.state = {
      activeFrame: this.props.activeFrame,
    };
  }

  render() {
    return (
      <>
        <svg
          id={this.svgId}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          {this.props.content}
        </svg>
      </>
    );
  }
}
