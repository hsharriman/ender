import React from "react";
import { BaseSVGProps } from "../../core/types";

export interface BaseSVGState {
  style: React.CSSProperties;
}

export class BaseSVGObject extends React.Component<BaseSVGProps, BaseSVGState> {
  readonly key: string;
  readonly names: string[];
  constructor(props: BaseSVGProps) {
    super(props);
    this.key = props.key;
    this.names = props.names ?? [];
    this.state = {
      style: props.style ?? {},
    };
  }

  isMatch = (name: string) =>
    this.names.find((n) => name === n) ? true : false;

  updateStyle = (newStyle: React.CSSProperties) => {
    this.setState({
      style: {
        ...this.state.style,
        ...newStyle,
      },
    });
  };
}
