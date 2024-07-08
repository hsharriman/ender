import React from "react";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { angleStr, triangleStr } from "../core/geometryText";
import { Obj } from "../core/types/types";
import { logEvent } from "../core/utils";

export interface LinkedTextProps {
  val: string;
  obj: BaseGeometryObject; // TODO correct type
  isActive?: boolean;
  linkedObjs?: BaseGeometryObject[];
}

export interface LinkedTextState {
  isClicked: boolean;
}
export class LinkedText extends React.Component<
  LinkedTextProps,
  LinkedTextState
> {
  // private activeColor = "#9A76FF"; // TODO
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: LinkedTextProps) {
    super(props);
    this.state = {
      isClicked: Boolean(this.props.isActive),
    };
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
      if (!this.props.obj) console.error("can't find ", this.props.val);
      this.props.obj.onClickText(isClicked);
      if (this.props.linkedObjs) {
        this.props.linkedObjs.forEach((obj) => {
          if (!obj) console.error("can't find ", this.props.val);
          obj.onClickText(isClicked);
        });
      }
    }
  };

  onPointerEnter = () => {
    logEvent("p", {
      c: "l",
      v: this.props.val,
    });
    this.onClick(true);
  };

  onPointerLeave = () => {
    this.onClick(false);
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
        return triangleStr(this.props.val);
      case Obj.Angle:
        return angleStr(this.props.val);
      default:
        return this.props.val;
    }
  };

  render() {
    return (
      <span
        className={`font-notoSerif ${this.getStyle()} cursor-pointer transition ease-in-out duration-150`}
        onPointerEnter={this.onPointerEnter}
        onPointerLeave={this.onPointerLeave}
        id={`${this.props.obj.tag}-text-${this.props.val}`}
        ref={this.wrapperRef}
      >
        {this.renderText()}
      </span>
    );
  }
}
