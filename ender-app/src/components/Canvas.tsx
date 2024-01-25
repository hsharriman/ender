import React from "react";

export interface CanvasProps {
  svg: JSX.Element;
  idx: number;
}
export class Canvas extends React.Component<CanvasProps,{}> {
  private svgId: string;
  constructor(props: CanvasProps) {
    super(props);
    this.svgId = `svg-object-${this.props.idx}`
  }

  render() {
    return (
      <div id="svg-canvas" className="box-border h-80 w-80 p-4 bg-white">
        {this.props.svg}
      </div>
    );
  }
}