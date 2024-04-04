import React from "react";
import { BaseSVG } from "../core/svg/BaseSVG";

// tracks text and construction of each row in a 2-column proof
export class ProofItem {
  svg: BaseSVG[];
  text: React.ReactNode;
  constructor(text: React.ReactNode, svg: BaseSVG[]) {
    this.svg = svg;
    this.text = text;
  }
  renderText = () => {
    return <div className="width-100 height-12">{this.text}</div>;
  };
  renderConstruction = () => {
    return (
      <>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {this.svg.length > 0 && this.svg.map((item) => item.render())}
        </svg>
      </>
    );
  };
}
