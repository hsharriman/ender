import React from "react";
import { Reason } from "../core/types/types";
import { logEvent } from "../core/utils";

interface TooltipProps {
  obj: JSX.Element;
  definition: Reason;
  isActive?: boolean;
}

interface TooltipState {
  isClicked: boolean;
}

export class DefinitionTooltip extends React.Component<
  TooltipProps,
  TooltipState
> {
  private wrapperRef: React.RefObject<HTMLDivElement>;
  constructor(props: TooltipProps) {
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
    }
  };

  onMouseEnter = () => {
    logEvent("m", {
      c: "d",
      v: this.props.definition.title,
    });
    this.onClick(true);
  };

  onMouseLeave = () => {
    this.onClick(false);
  };

  render() {
    const keyword = this.props.definition.title;
    const definition = this.props.definition.body;
    return (
      <span
        className={`font-notoSerif ${this.getStyle()} cursor-pointer transition ease-in-out duration-150 group relative`}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        ref={this.wrapperRef}
      >
        <div className="font-notoSans pointer-events-none absolute -top-20 inset-x-0 w-max opacity-0 transition-opacity group-hover:opacity-100 shadow-[rgba(0,0,15,0.1)_5px_5px_4px_1px] bg-white text-black p-2 rounded-md text-left z-40">
          <h2 className="text-[15px]">{keyword}</h2>
          <p className="font-normal text-sm">{definition}</p>
        </div>
        <span>{this.props.obj}</span>
      </span>
    );
  }
}
