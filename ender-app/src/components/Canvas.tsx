import React from "react";

export interface CanvasProps {
  svg: JSX.Element;
  idx: number;
}
export class Canvas extends React.Component<CanvasProps,{}> {
  render() {
    return (
      <div id="svg-canvas" className="box-border h-80 w-80 p-4 bg-white">
        <svg id={`svg-object-${this.props.idx}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {this.props.svg}
        </svg>
      </div>
    );
  }
}