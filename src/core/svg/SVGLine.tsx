import React from "react";
import { Obj, SVGModes, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { BaseSVG } from "./BaseSVG";
import { HoverTextLabel } from "./HoverTextLabel";
import { ModeCSS } from "./SVGStyles";
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
      css: this.updateStyle(
        this.state.isPinned ? SVGModes.Active : this.props.mode
      ),
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

  onTextClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
      css: this.updateStyle(isActive ? SVGModes.Pinned : this.props.mode),
    });
    const prefix = `#${Obj.Segment}-text-`;
    const seg = this.props.geoId.replace("segment.", "");
    const matches = document.querySelectorAll(
      prefix + seg + ", " + prefix + seg.split("").reverse().join("") // TODO delete when all segments are alphabetical
    );
    matches.forEach((ele) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMCLICKTEXT.split(" ");
        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
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
        css: this.updateStyle(isActive ? SVGModes.Active : this.props.mode),
      });
    }
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
          className={
            this.state.isActive || this.state.isPinned
              ? this.state.css
              : this.updateStyle(this.props.mode)
          }
        />
        {this.props.hoverable && (
          <line
            x1={this.start[0]}
            x2={this.end[0]}
            y1={this.start[1]}
            y2={this.end[1]}
            key={this.geoId + "-hover"}
            id={this.geoId + "-hover"}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            style={{ opacity: 0, stroke: "red", strokeWidth: 22 }} // TODO make invisible
          />
        )}
        {this.props.hoverable && (
          <HoverTextLabel
            pt={vops.add(midpt, norm)}
            rot={angleDeg}
            text={this.props.geoId.replace("segment.", "")}
            isHovered={this.state.isActive}
            clickedCallback={this.onTextClick}
          />
        )}
      </>
    );
  }
}
