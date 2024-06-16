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
      css: this.state.isPinned ? this.updateStyle(SVGModes.Active) : "",
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
      if (!this.state.isPinned) this.onHover(false);
    }
  };

  onTextClick = () => {
    const pin = !this.state.isPinned === true;
    this.setState({
      isPinned: pin,
      css: pin ? this.updateStyle(SVGModes.ActiveText) : "",
    });
    const matches = document.querySelectorAll(
      `#${Obj.Point}-text-${this.props.geoId.replace("text.", "")}`
    );
    matches.forEach((ele) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMCLICKTEXT.split(" ");
        if (pin) {
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
        css: isActive ? this.updateStyle(SVGModes.ActiveText) : "",
      });
    }
  };

  render() {
    return (
      <>
        <text
          x={this.point[0]}
          y={this.point[1]}
          id={this.geoId}
          key={this.geoId}
          style={this.style}
          className={this.state.isActive ? this.state.css : ""}
        >
          {this.text}
        </text>
        {this.props.hoverable && (
          <text
            x={this.point[0]}
            y={this.point[1]}
            id={this.geoId + "-hover"}
            key={this.geoId + "-hover"}
            style={{ opacity: 0, color: "red", cursor: "pointer" }}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onTextClick()}
            className="text-xl"
          >
            {this.text}
          </text>
        )}
      </>
    );
  }
}
