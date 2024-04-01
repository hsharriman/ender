import React from "react";
import { BaseSVG } from "../core/svg/BaseSVG";

export interface EuclideanProps {
  svgIdSuffix: number;
  content: () => BaseSVG[];
}

interface EuclideanState {
  content: BaseSVG[];
}

export class Euclidean extends React.Component<EuclideanProps, EuclideanState> {
  private svgId: string;
  private svgContent: BaseSVG[];

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
          {this.state.content.length > 0 &&
            this.state.content.map((item) => item.renderSVG())}
        </svg>
      </>
    );
  }
}
