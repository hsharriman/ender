import React from "react";
import { Obj } from "../core/types";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";

export interface LinkedTextProps {
  val: string;
  activeColor?: string;
  obj: BaseGeometryObject; // TODO correct type
  isActive?: boolean;
  linkedObjs?: BaseGeometryObject[];
  // clickCallback?: (isActive: boolean) => void;
}

export interface LinkedTextState {
  isClicked: boolean;
}
export class LinkedText extends React.Component<
  LinkedTextProps,
  LinkedTextState
> {
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
      this.onClick(false);
    }
  };

  getColor = () => {
    return this.state.isClicked ? "stroke-violet-500" : "";
  };

  getStyle = () => {
    return this.state.isClicked ? "text-violet-500 font-bold" : "";
  };

  onClick = (isClicked: boolean) => {
    if (isClicked !== this.state.isClicked) {
      this.setState({
        isClicked,
      });
      this.props.obj.onClickText(isClicked);
      if (this.props.linkedObjs) {
        this.props.linkedObjs.forEach((obj) => {
          obj.onClickText(isClicked);
        });
      }
    }
  };

  renderText = () => {
    switch (this.props.obj.tag) {
      case Obj.Segment:
        return (
          <span
            style={{ borderTop: `2px solid ${this.getColor()}` }}
          >{`${this.props.val}`}</span>
        );
      case Obj.Triangle:
        return (
          <span>
            <span className="text-l leading-4">{`\u25B5`}</span>
            {this.props.val}
          </span>
        );
      case Obj.Angle:
        return (
          <span>
            <span className="text-2xl leading-4">{`\u29A3`}</span>
            {this.props.val}
          </span>
        );
      default:
        return this.props.val;
    }
  };

  render() {
    return (
      <span
        className={`font-serif ${this.getStyle()} cursor-pointer transition ease-in-out duration-150`}
        // style={this.getStyle()}
        onMouseEnter={() => this.onClick(true)}
        onMouseLeave={() => this.onClick(false)}
        ref={this.wrapperRef}
      >
        {this.renderText()}
      </span>
    );
  }
}