import React from "react";
import { Vector } from "../../core/types/types";
import { vops } from "../../core/vectorOps";

export interface ReliesOnProps {
  reliesOn: Map<string, Set<string>>;
  activeFrame: string;
  rowHeight: ReliesRowHeight;
}
export enum ReliesRowHeight {
  Compact = 46,
  Normal = 64,
}
interface Dims {
  r: number;
  t: number;
  b: number;
  key: string;
}

export class ReliesOn extends React.Component<ReliesOnProps> {
  private SVGWIDTH: number;
  private MIDX: number;
  private MIDY: number;
  private DEFAULT_CLR = "stroke-black";
  private STROKE_WIDTH = "4px";
  private LEFTPAD = 7;

  constructor(props: ReliesOnProps) {
    super(props);
    this.MIDY = this.props.rowHeight / 2;
    this.SVGWIDTH = this.isCompact() ? 80 : 80;
    this.MIDX = (6 * this.SVGWIDTH) / 15;
  }

  isCompact = () => this.props.rowHeight === ReliesRowHeight.Compact;

  getRowCoords = (frameKey: string): Dims | undefined => {
    const rowEle = document.getElementById(`prooftext-${frameKey}`);
    if (rowEle) {
      const rowRect = rowEle.getBoundingClientRect();
      return {
        r: rowRect.left + this.LEFTPAD + window.scrollX - this.SVGWIDTH, // left side of row
        t: rowRect.top + window.scrollY, // top of row,
        b: rowRect.bottom + window.scrollY,
        key: frameKey,
      };
    }
  };

  container = (d: Dims, innerContent: JSX.Element) => {
    const divHeight = Math.round(d.b - d.t);
    return (
      <div
        className="absolute w-16"
        key={`relies-${d.t}`}
        style={{
          top: `${d.t}px`,
          left: `${d.r}px`,
          height: `${divHeight}px`,
        }}
      >
        {innerContent}
      </div>
    );
  };

  vertDists = (): Dims[] => {
    const dependsOn = this.props.reliesOn.get(this.props.activeFrame);
    if (dependsOn) {
      const startCoords = this.getRowCoords(this.props.activeFrame);

      let endCoords = [];
      const deps = Array.from(dependsOn);
      for (let i = 0; i < deps.length; i++) {
        let dep = deps[i];
        let coords = this.getRowCoords(
          dep.endsWith("?") ? dep.replace("?", "") : dep
        );
        if (coords) {
          endCoords.push(coords);
        }
      }

      if (startCoords && endCoords.length > 0) {
        const tops = endCoords.sort((a, b) => a.t - b.t);
        tops.push(startCoords);
        return tops;
      }
    }
    return [];
  };

  renderQuestionEdge = (d: Dims) => {
    return this.container(
      d,
      <svg width="100%" height="100%">
        <text
          x={0}
          y={5 + this.MIDY}
          className={"fill-red-500 text-xl font-bold"}
        >
          ?
        </text>
        <polyline
          points={`11,${this.MIDY} ${this.MIDX},${this.MIDY}`}
          className={"stroke-red-500"}
          fill="none"
          strokeWidth={this.STROKE_WIDTH}
        />
      </svg>
    );
  };

  renderDepEdge = (d: Dims) => {
    return this.container(
      d,
      <svg width="100%" height="100%">
        {/* <circle r="5px" cx="5px" cy="50%" className={"fill-black"} /> */}
        <polyline
          points={`${this.SVGWIDTH},${this.MIDY} ${this.MIDX},${this.MIDY}`}
          className={this.DEFAULT_CLR}
          fill="none"
          strokeWidth={this.STROKE_WIDTH}
        />
      </svg>
    );
  };

  chevron = (sideLength: number, corner: Vector) => {
    const len: Vector = [sideLength, 0];
    const points = [
      vops.add(vops.rot(len, 135), corner),
      corner,
      vops.add(vops.rot(len, 225), corner),
    ];
    return points
      .map((p) => `${p[0]},${p[1]}`)
      .toString()
      .replaceAll(",", " ");
  };

  renderArrow = (d: Dims) => {
    const rightPad = 23;
    const corner: Vector = [this.MIDX + rightPad, this.MIDY];
    const pts = this.chevron(13, corner);
    return this.container(
      d,
      <svg width="100%" height="100%">
        <polyline
          points={pts}
          className={this.DEFAULT_CLR}
          fill="none"
          strokeWidth={this.STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1={`${corner[0]}px`}
          y1={`${corner[1]}px`}
          x2={`${this.MIDX}px`}
          y2={`${corner[1]}px`}
          className={this.DEFAULT_CLR}
          fill="none"
          strokeWidth={this.STROKE_WIDTH}
        />
      </svg>
    );
  };

  renderFullConnector = (dims: Dims[]) => {
    let arrow = dims[0].t + this.MIDY;
    let end = dims[dims.length - 1].b - this.MIDY;
    let divHeight = Math.abs(arrow - end);
    return (
      <div
        className="absolute w-16"
        style={{
          top: `${Math.min(arrow, end) - 2}px`, // -2px to compensate for lines not perfectly overlapping
          left: `${dims[0].r}px`,
          height: `${divHeight + 4}px`, // +4px to compensate for svg lines not perfectly overlapping
        }}
      >
        <svg width="100%" height="100%">
          <line
            x1={`${this.MIDX}px`}
            x2={`${this.MIDX}px`}
            y1={0}
            y2={`${
              divHeight +
              (this.props.rowHeight === ReliesRowHeight.Compact ? 2 : 4)
            }px`}
            className={this.DEFAULT_CLR}
            fill="none"
            strokeWidth={this.STROKE_WIDTH}
          />
        </svg>
      </div>
    );
  };

  render() {
    const dependsOn = this.props.reliesOn.get(this.props.activeFrame);
    let innerContent = <></>;
    if (dependsOn) {
      const dims = this.vertDists();

      let lastBottom = dims[0].b;
      const svgs = dims.map((d, i) => {
        if (i === dims.length - 1) {
          return this.renderArrow(d);
        }
        if (Array.from(dependsOn)[i].endsWith("?")) {
          const svg = this.renderQuestionEdge(d);
          lastBottom = d.b;
          return svg;
        }
        const svg = this.renderDepEdge(d);
        lastBottom = d.b;
        return svg;
      });
      innerContent = (
        <div>
          {this.renderFullConnector(dims)}
          {svgs}
        </div>
      );
    }
    return (
      <div id="relies-on">
        <div className="absolute top-0 left-0 w-full h-screen -z-10">
          {innerContent}
        </div>
      </div>
    );
  }
}
