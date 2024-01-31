import { CSSProperties } from "react";
import { SVGCircle } from "./SVGCircle";
import { SVGCurve } from "./SVGCurve";
import { SVGLine } from "./SVGLine";
import { SVGPolyline } from "./SVGPolyline";
import { SVGText } from "./SVGText";
import { Vector } from "../types";
import { vops } from "../vectorOps";
import { BaseSVG } from "./BaseSVG";
import {
  CircleSVGProps,
  LineSVGProps,
  TextSVGProps,
  PolylineSVGProps,
  CircularArcSVGProps,
} from "./svgTypes";

const SVG_SCALE = 20;
const SVG_DIM = 200;
const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 8;
const SVG_XSHIFT = 40;
const SVG_YSHIFT = -40;

export class SVGBuilder {
  content: BaseSVG[];
  constructor(content?: BaseSVG[]) {
    this.content = content ?? [];
  }

  addContent = (item: BaseSVG) => {
    if (!this.content.find((elem) => elem.key === item.key)) {
      this.content = this.content.concat(item);
    }
  };

  batchAdd = (items: BaseSVG[]) => {
    items.map((item) => this.addContent(item));
  };

  contents = () => this.content;

  getExistingElement = (id: string) => {
    const matches = this.content.filter((item) => item.key === id);
    if (matches.length > 1) {
      console.log("more than 1 match for id, ", id, matches);
    }
    return matches[0];
  };

  setStyle = (id: string, overrides: CSSProperties) => {
    const matches = this.content.filter((item) => item.key === id);
    if (matches.length > 1) {
      console.log("more than 1 match for id, ", id, matches);
    }
    matches[0].setStyle(overrides);
  };

  coordsToSvg = (coords: Vector, offset: Vector = [0, 0]): Vector => {
    // scale coordinates, shift and invert y axis
    // TODO scale the transformation based on canvas size
    let vec = vops.add(vops.smul(coords, SVG_SCALE), [
      SVG_XSHIFT + offset[0],
      SVG_YSHIFT + offset[1],
    ]);
    return [vec[0], SVG_DIM - vec[1]];
  };

  scaleToSvg = (n: number) => n * SVG_SCALE;

  addCircle = (props: CircleSVGProps) => {
    this.addContent(new SVGCircle(props));
  };

  addLine = (props: LineSVGProps) => {
    this.addContent(new SVGLine(props));
  };

  addText = (props: TextSVGProps) => {
    this.addContent(new SVGText(props));
  };

  addPolyline = (props: PolylineSVGProps) => {
    this.addContent(new SVGPolyline(props));
  };

  addCircularArc = (props: CircularArcSVGProps) => {
    this.addContent(new SVGCurve(props));
  };
}
