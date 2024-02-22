import React from "react";

export interface LinkedTextProps {
  val: string;
  activeColor: string;
  isActive?: boolean;
  // TODO callback?
}

export interface LinkedTextState {
  isClicked: boolean;
}
export class LinkedText extends React.Component<
  LinkedTextProps,
  LinkedTextState
> {
  private defaultColor = "black"; // TODO
  constructor(props: LinkedTextProps) {
    super(props);
    this.state = {
      isClicked: Boolean(this.props.isActive),
    };
  }

  getColor = () => {
    return this.props.isActive || this.state.isClicked
      ? this.props.activeColor
      : this.defaultColor;
  };
  getStyle = () => {
    return {
      color: this.getColor(),
      border: this.state.isClicked ? `1px solid ${this.props.activeColor}` : "",
    };
  };
  handleClick = () => {
    this.setState({
      isClicked: !this.state.isClicked,
    });
  };
  seg = (v: string) => (
    <span style={{ borderTop: `1px solid ${this.getColor()}` }}>{`${v}`}</span>
  );
  triangle = (v: string) => <span>{`&#U+25B5;${v}`}</span>;
  angle = (v: string) => <span>{`&#U+29A3;${v}`}</span>;

  render() {
    return (
      <span
        className="font-sans"
        style={this.getStyle()}
        onClick={this.handleClick}
      >
        {this.props.val}
      </span>
    );
  }
}

const congruent = (v1: string, v2: string) => {
  return <span>{`${v1} &#U+2245; ${v2}`}</span>;
};

const parallel = (v1: string, v2: string) => {
  return <span>{`${v1} &#U+2225; ${v2}`}</span>;
};
