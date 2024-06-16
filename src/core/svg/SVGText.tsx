import React from "react";
import { Obj, SVGModes, Vector } from "../types/types";
import { BaseSVG } from "./BaseSVG";
import { ModeCSS } from "./SVGStyles";
import { TextSVGProps } from "./svgTypes";

export class SVGText extends BaseSVG {
  private text: string;
  private point: Vector;
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: TextSVGProps) {
    super(props);
    const { text, point } = props;
    this.text = text;
    this.point = point;
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

  onTextClick = (isPinned?: boolean) => {
    if (isPinned) {
      this.setState({
        isPinned,
        css: this.updateStyle(isPinned ? SVGModes.Pinned : this.props.mode),
      });
      const matches = document.querySelectorAll(
        `#${Obj.Point}-text-${this.props.geoId.replace("point.", "")}`
      );
      matches.forEach((ele) => {
        if (ele) {
          const cls = ModeCSS.DIAGRAMCLICKTEXT.split(" ");
          if (isPinned) {
            ele.classList.add(...cls);
          } else {
            ele.classList.remove(...cls);
          }
        }
      });
    }
  };

  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
        css: this.updateStyle(isActive ? SVGModes.ActiveText : this.props.mode),
      });
    }
  };

  render() {
    return (
      <text
        x={this.point[0]}
        y={this.point[1]}
        id={this.geoId}
        key={this.geoId}
        style={this.style}
        onPointerEnter={() => this.onHover(true)}
        onPointerLeave={() => this.onHover(false)}
        onClick={() =>
          this.props.hoverable
            ? this.onTextClick(!this.state.isPinned)
            : () => {}
        }
        className={
          this.state.isActive || this.state.isPinned
            ? this.state.css
            : this.updateStyle(this.props.mode)
        }
      >
        {this.text}
      </text>
    );
  }
}
