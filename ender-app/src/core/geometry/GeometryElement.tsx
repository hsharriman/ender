import React from "react";
import { SVGModes } from "../types";

export interface GeometryElementProps {
  activeFrame: string;
}

export interface GeometryElementState {
  isHovered: boolean;
  isActive: boolean;
  activeFrame: string;
}
export class GeometryElement extends React.Component<
  GeometryElementProps,
  GeometryElementState
> {
  modes: Map<string, SVGModes> | undefined;
  content?: (activeFrame: string) => JSX.Element[];
  constructor(props: GeometryElementProps) {
    super(props);
    this.state = {
      isHovered: false,
      isActive: false,
      activeFrame: this.props.activeFrame,
    };
  }

  setup(
    content: (activeFrame: string) => JSX.Element[],
    modes: Map<string, SVGModes>
  ) {
    this.modes = modes;
    this.content = content;
  }

  setActive = (isActive: boolean) => {
    if (isActive !== this.state.isActive) {
      this.setState({
        isActive,
      });
    }
  };

  setActiveFrame = (activeFrame: string) => {
    if (activeFrame !== this.state.activeFrame) {
      this.setState({
        activeFrame,
      });
    }
  };

  render() {
    // TODO had hover event listener
    return this.content ? this.content(this.state.activeFrame) : <></>;
  }
}
