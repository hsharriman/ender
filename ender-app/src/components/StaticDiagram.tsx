import React from "react";

export interface DiagramProps {
  svgIdSuffix: string;
  svgElements: JSX.Element[];
  width: string;
  height: string;
}

export class StaticDiagram extends React.Component<DiagramProps, {}> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-static-object-${props.svgIdSuffix}`;
  }

  render() {
    return (
      <div>
        <svg
          id={this.svgId}
          viewBox="0 0 500 300"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {this.props.svgElements}
        </svg>
      </div>
    );
  }
}
