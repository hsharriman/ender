import React from "react";
import { SVGModes, Vector } from "../types/types";
import { vops } from "../vectorOps";
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
    this.state = {
      isActive: false,
      css: this.state.isPinned
        ? this.updateStyle(SVGModes.Active)
        : this.updateStyle(this.props.mode),
    };
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
      this.onHover(false);
    }
  };

  // TODO
  onTextClick = (isActive: boolean) => {
    console.log(isActive);
    this.setState({
      isActive,
      isPinned: isActive,
      css: this.updateStyle(isActive ? SVGModes.Active : this.props.mode),
    });
  };

  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: this.updateStyle(isActive ? SVGModes.Active : this.props.mode), // TODO default is focused resetting style is not working right
      });
    }
    // this.props.clickCallback && this.props.clickCallback(isClicked);
  };

  render() {
    const midpt: Vector = [
      (this.start[0] + this.end[0]) / 2,
      (this.start[1] + this.end[1]) / 2,
    ];
    let padding = [0, 0];
    // match rotation of text to be parallel with line
    let unit = vops.unit(vops.sub(this.start, this.end));
    // make sure unit vector is within -90 to 90 deg from origin
    if (unit[0] < 0) {
      unit = vops.smul(unit, -1);
      padding = [0, 0];
    }
    const norm = vops.smul(vops.rot(unit, 90), 20);
    const angleDeg = Math.atan2(unit[1], unit[0]) * (180 / Math.PI);
    return (
      <>
        <line
          x1={this.start[0]}
          x2={this.end[0]}
          y1={this.start[1]}
          y2={this.end[1]}
          key={this.geoId}
          id={this.geoId}
          className={this.state.css}
        />
        <line
          x1={this.start[0]}
          x2={this.end[0]}
          y1={this.start[1]}
          y2={this.end[1]}
          key={this.geoId + "-hover"}
          id={this.geoId + "-hover"}
          onPointerEnter={() => this.onHover(true)}
          onPointerLeave={() => this.onHover(false)}
          style={{ opacity: 0, stroke: "red", strokeWidth: 18 }} // TODO make invisible
        />
        <LabelText
          pt={vops.add(midpt, norm)}
          rot={angleDeg}
          text={this.props.geoId.replace("segment.", "")}
          isHovered={this.state.isActive}
          clickedCallback={this.onTextClick}
        />
      </>
    );
  }
}

export interface LabelTextProps {
  pt: Vector;
  rot: number;
  text: string;
  isHovered: boolean;
  clickedCallback: (isClicked: boolean) => void;
}

interface LabelTextState {
  isClicked: boolean;
}
class LabelText extends React.Component<LabelTextProps, LabelTextState> {
  private defaultCSS =
    "ease-in-out duration-300 fill-purple-500 text-purple-500";
  constructor(props: LabelTextProps) {
    super(props);
    this.state = {
      isClicked: false,
    };
  }
  getClassName = () => {
    if (this.state.isClicked || this.props.isHovered) {
      return this.defaultCSS + "opacity-100 visible cursor-pointer";
    } else if (!this.props.isHovered) {
      return this.defaultCSS + "opacity-0 invisible delay-700 cursor-default";
    } else {
      return this.defaultCSS + "opacity-0 invisible cursor-default";
    }
  };
  onClick = () => {
    this.props.clickedCallback(!this.state.isClicked);
    this.setState({ isClicked: !this.state.isClicked });
  };
  render() {
    return (
      <text
        textAnchor="middle"
        transform={`translate(${this.props.pt[0]},${this.props.pt[1]}) rotate(${this.props.rot})`}
        className={this.getClassName()}
        onClick={() => this.onClick()} // TODO
        key={this.props.text + "-label"}
      >
        {this.props.text}
      </text>
    );
  }
}
