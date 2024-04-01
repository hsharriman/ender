import React from "react";
import { Obj } from "../core/types";

export interface LinkedTextProps {
  val: string;
  activeColor?: string;
  type: Obj; // TODO correct type
  isActive?: boolean;
  clickCallback?: (isActive: boolean) => void;
}

export interface LinkedTextState {
  isClicked: boolean;
}
export class LinkedText extends React.Component<
  LinkedTextProps,
  LinkedTextState
> {
  private defaultColor = "black"; // TODO
  private activeColor = "#9A76FF"; // TODO
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: LinkedTextProps) {
    super(props);
    this.state = {
      isClicked: Boolean(this.props.isActive),
    };
    this.activeColor = this.props.activeColor || this.activeColor;
    this.wrapperRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    if (
      this.wrapperRef &&
      !this.wrapperRef.current?.contains(event.target as Node)
    ) {
      this.onClick(false);
    }
  };

  getColor = () => {
    return this.props.isActive || this.state.isClicked
      ? this.activeColor
      : this.defaultColor;
  };

  getStyle = () => {
    return {
      color: this.getColor(),
      border: this.state.isClicked ? `1px solid ${this.props.activeColor}` : "",
      fontWeight: this.state.isClicked ? "bold" : "normal",
    };
  };

  onClick = (isClicked: boolean) => {
    this.setState({
      isClicked,
    });
    this.props.clickCallback && this.props.clickCallback(isClicked);
  };

  renderText = () => {
    switch (this.props.type) {
      case Obj.Segment:
        return (
          <span
            style={{ borderTop: `2px solid ${this.getColor()}` }}
          >{`${this.props.val}`}</span>
        );
      case Obj.Triangle:
        return `\u25B5${this.props.val}`;
      case Obj.Angle:
        return `\u29A3${this.props.val}`;
      default:
        return this.props.val;
    }
  };

  render() {
    return (
      <span
        className="font-sans"
        style={this.getStyle()}
        onClick={() => this.onClick(!this.state.isClicked)}
        ref={this.wrapperRef}
      >
        {this.renderText()}
      </span>
    );
  }
}
