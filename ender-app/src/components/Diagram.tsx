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
