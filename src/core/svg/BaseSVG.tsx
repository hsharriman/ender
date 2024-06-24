import React, { CSSProperties } from "react";
import { SVGModes } from "../types/types";
import { ModeCSS } from "./SVGStyles";
import { BaseSVGProps } from "./svgTypes";

export interface BaseSVGState {
  isActive: boolean;
  css: string;
  isPinned?: boolean;
}

export class BaseSVG extends React.Component<BaseSVGProps, BaseSVGState> {
  readonly geoId: string;
  readonly mode: SVGModes;
  style: CSSProperties;
  constructor(props: BaseSVGProps) {
    super(props);
    this.geoId = props.geoId;
    this.mode = props.mode;
    this.style = props.style ?? {};
    this.state = {
      isActive: false,
      css: this.updateStyle(this.props.mode),
      isPinned: false,
    };
  }

  updateStyle = (mode: SVGModes) => {
    switch (mode) {
      case SVGModes.Active:
        return ModeCSS.ACTIVE;
      case SVGModes.Default:
        return ModeCSS.DEFAULT;
      case SVGModes.Focused:
        return ModeCSS.FOCUSED;
      case SVGModes.Unfocused:
        return ModeCSS.UNFOCUSED;
      case SVGModes.Purple:
        return ModeCSS.PURPLE;
      case SVGModes.Blue:
        return ModeCSS.BLUE;
      case SVGModes.Pinned:
        return ModeCSS.PINNED;
      case SVGModes.ActiveText:
        return ModeCSS.ACTIVETEXT;
      case SVGModes.Hidden:
      default:
        return ModeCSS.HIDDEN;
    }
  };

  onHover = (isActive: boolean) => {
    if (isActive !== this.state.isActive) {
      this.setState({ isActive });
    }
  };

  render() {
    return <></>;
  }
}
