import { CSSProperties } from "react";
import { SVGObj, BaseSVGProps } from "./svgTypes";
import React from "react";
import { SVGModes } from "../types";
import { ModeCSS } from "./SVGStyles";

export interface BaseSVGState {
  isActive: boolean;
}

export class BaseSVG extends React.Component<BaseSVGProps, BaseSVGState> {
  readonly key: string;
  readonly names: string[];
  // readonly tag: SVGObj;
  readonly activeColor?: string;
  readonly modes: Map<string, SVGModes> | undefined;
  style: CSSProperties;
  constructor(props: BaseSVGProps) {
    super(props);
    this.key = props.key;
    this.names = props.names ?? [];
    this.modes = props.modes;
    // this.tag = props.tag;
    this.style = props.style ?? {};
    this.state = {
      isActive: false,
    };
  }

  updateStyle = () => {
    switch (this.modes?.get(this.props.activeFrame)) {
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

  isMatch = (name: string) =>
    this.names.find((n) => name === n) ? true : false;

  render() {
    return <></>;
  }
}
