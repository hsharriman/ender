import React from "react";
import { Vector } from "../types";
import { BaseSVG } from "./BaseSVG";
import { LineSVGProps } from "./svgTypes";

export class SVGLine extends BaseSVG {
  private start: Vector;
  private end: Vector;
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: LineSVGProps) {
    super(props);
    const { start, end } = props;
    this.start = start;
    this.end = end;
    this.wrapperRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    document.addEventListener("mouseover", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseover", this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    if (
      this.wrapperRef &&
      !this.wrapperRef.current?.contains(event.target as Node)
    ) {
      this.onClick(false);
    }
  };

  onTextClick = (isActive: boolean) => {};

  onClick = (isActive: boolean) => {
    this.setState({
      isActive,
    });
    // this.props.clickCallback && this.props.clickCallback(isClicked);
  };

  render() {
    let elem = (
      <line
        x1={this.start[0]}
        x2={this.end[0]}
        y1={this.start[1]}
        y2={this.end[1]}
        key={this.geoId}
        id={this.geoId}
        style={this.updateStyle()}
        // ref={this.wrapperRef}
        onMouseOver={() => this.onClick(true)} // TODO
        onMouseOut={() => this.onClick(false)} // TODO
      />
    );
    return elem;
  }
}
