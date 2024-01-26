import React from "react";

export interface EuclideanProps {
  svgIdSuffix: number;
  content: () => JSX.Element[];
}

interface EuclideanState {
  content: JSX.Element[];
}

export class Euclidean extends React.Component<EuclideanProps, EuclideanState> {
  private svgId: string;
  private svgContent: JSX.Element[];

  constructor(props: EuclideanProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
    this.svgContent = props.content();
    this.state = {
      content: this.svgContent,
    };
  }

  getContent = () => {
    return this.state.content;
  };

  render() {
    return (
      <>
        <svg
          id={this.svgId}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          {this.state.content}
        </svg>
      </>
    );
  }
}
