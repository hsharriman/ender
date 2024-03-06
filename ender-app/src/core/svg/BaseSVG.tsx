import { CSSProperties } from "react";
import { SVGObj, BaseSVGProps } from "./svgTypes";

export class BaseSVG {
  readonly key: string;
  readonly names: string[];
  readonly tag: SVGObj;
  readonly activeColor?: string;
  style: CSSProperties;
  constructor(props: BaseSVGProps, tag: SVGObj) {
    this.key = props.key;
    this.names = props.names ?? [];
    this.tag = tag;
    this.style = props.style ?? {};
  }

  isMatch = (name: string) =>
    this.names.find((n) => name === n) ? true : false;

  renderSVG: () => JSX.Element = () => {
    return <></>;
  };
}
