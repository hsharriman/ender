import React from "react";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { Obj } from "../core/types/types";
import { logEvent } from "../core/utils";

export interface LinkedTextProps {
  val: string;
  obj: BaseGeometryObject; // TODO correct type
  isActive?: boolean;
  linkedObjs?: BaseGeometryObject[];
  clr?: string;
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

  getStyle = () => {
    if (this.state.isClicked) {
      return "text-violet-500 font-bold border-violet-400";
    } else if (this.props.clr === "lightblue") {
      // TODO issue is that opacity is not reduced from parent, need to set lighter color directly with this approach.
      return "text-sky-400";
    } else if (this.props.clr === "blue") {
      return "text-sky-600";
    } else {
      return "";
    }
  };

  // getColoredStyle = () => {
  //   if (this.state.isClicked) {
  //     return { color: "rgb(139, 92, 246)", fontWeight: 700 };
  //   } else if (this.props.clr) {
  //     return { color: this.props.clr };
  //   } else {
  //     return {};
  //   }
  // };

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
            className={`${this.getStyle()} border-t-2 border-solid`}
          >{`${this.props.val}`}</span>
        );
      case Obj.Triangle:
        return (
          <span className={`font-notoSerif opacity-inherit ${this.getStyle()}`}>
            <span className="text-l leading-4 font-semibold opacity-inherit">{`\u25B3`}</span>
            {this.props.val}
          </span>
        );
      case Obj.Angle:
        return (
          <span className={`font-notoSerif opacity-inherit ${this.getStyle()}`}>
            <span className="text-2xl leading-4">{`\u2220`}</span>
            {this.props.val}
          </span>
        );
      default:
        return <span className={this.getStyle()}>{this.props.val}</span>;
    }
  };

  render() {
    return (
      <span
        className={`font-notoSerif cursor-pointer transition ease-in-out duration-150`}
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
