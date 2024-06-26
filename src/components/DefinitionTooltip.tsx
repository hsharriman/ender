import React from "react";
import { Definition } from "../theorems/definitions";

interface TooltipProps {
  obj: JSX.Element;
  definition: Definition;
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

  render() {
    const keyword = this.props.definition.keyword;
    const definition = this.props.definition.definition;
    console.log(this.props.obj);
    return (
      <span
        className={`font-notoSerif ${this.getStyle()} cursor-pointer transition ease-in-out duration-150 group relative`}
        onMouseEnter={() => this.onClick(true)}
        onMouseLeave={() => this.onClick(false)}
        ref={this.wrapperRef}
      >
        <span className="font-notoSans pointer-events-none absolute -top-20 inset-x-0 w-max opacity-0 transition-opacity group-hover:opacity-100 shadow-[rgba(0,0,15,0.1)_5px_5px_4px_1px] bg-white text-black p-2 rounded-md text-left">
          <h2 className="text-[15px]">{keyword}</h2>
          <p className="font-normal text-sm">{definition}</p>
        </span>
        <span>{this.props.obj}</span>
      </span>
    );
  }
}
