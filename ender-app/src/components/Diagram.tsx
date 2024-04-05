import React from "react";

export interface DiagramProps {
  svgIdSuffix: string;
  svgElements: (activeFrame: string) => JSX.Element[];
  activeFrame: string;
  width: string;
  height: string;
}

interface DiagramState {
  activeFrame: string;
}

export class Diagram extends React.Component<DiagramProps, DiagramState> {
  private svgId: string;

  // TODO
  // euclidean needs to render a list of all BaseSVG objects that will
  // ever appear in the construction. It needs state to track
  // when each object should be rendered as well
  // it needs to remember what state each object should be at each frame
  // each object should have its own render function that updates
  // based on the following states: focused, unfocus, hidden, active, default
  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
    this.state = {
      activeFrame: this.props.activeFrame,
    };
  }

  render() {
    return (
      <>
        <svg
          id={this.svgId}
          width={this.props.width}
          height={this.props.height}
          xmlns="http://www.w3.org/2000/svg"
        >
          {this.props.svgElements(this.props.activeFrame)}
        </svg>
      </>
    );
  }
}
