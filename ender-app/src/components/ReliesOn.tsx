import React from "react";
import { SVGPolyline } from "../core/svg/SVGPolyline";

export interface ReliesOnProps {
  reliesOn: Map<string, Set<string>>;
  activeFrame: string;
  rowHeight: number;
  // TODO indices of frames? or pixel locations would be nice...
}
interface Dims {
  l: number;
  t: number;
  b: number;
  key: string;
}

export interface ReliesOnState {}
export class ReliesOn extends React.Component<ReliesOnProps, ReliesOnState> {
  private DEFAULT_CLR = "#D8B1FF";
  buildGraph = () => {};

  getRowCoords = (frameKey: string): Dims | undefined => {
    // TODO make work for any row type
    const rowEle = document.getElementById(`prooftext-${frameKey}`);
    if (rowEle) {
      const rowRect = rowEle.getBoundingClientRect();
      return {
        l: rowRect.right, // right side of row
        t: rowRect.top, // top of row,
        b: rowRect.bottom,
        key: frameKey,
      };
    }
  };

  vertDists = (): Dims[] => {
    const dependsOn = this.props.reliesOn.get(this.props.activeFrame);
    if (dependsOn) {
      const startCoords = this.getRowCoords(this.props.activeFrame);

      let endCoords = [];
      const deps = Array.from(dependsOn);
      for (let i = 0; i < deps.length; i++) {
        let coords = this.getRowCoords(deps[i]);
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

  renderDepEdge = (d: Dims, highest: boolean = true) => {
    const divHeight = Math.round(d.b - d.t);
    const rightCoord = this.props.rowHeight;
    return (
      <div
        className="absolute w-8"
        style={{
          top: `${d.t}px`,
          left: `${d.l}px`,
          height: `${divHeight}px`,
        }}
      >
        <svg width="100%" height="100%">
          <circle r="5px" cx="5px" cy="50%" fill={this.DEFAULT_CLR} />
          <polyline
            points={`0,${this.props.rowHeight / 2} 30, ${
              this.props.rowHeight / 2
            } 30, ${this.props.rowHeight}`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
          {!highest && (
            <line
              x1="30px"
              y1="0"
              x2="30px"
              y2={`${this.props.rowHeight / 2}px`}
              strokeWidth="3px"
              stroke={this.DEFAULT_CLR}
            />
          )}
        </svg>
      </div>
    );
  };

  renderArrow = (d: Dims) => {
    // TODO make less absolutely calculated by pixel values + assumed row height
    return (
      <div
        className="absolute w-8"
        style={{
          top: `${d.t}px`,
          left: `${d.l}px`,
          height: `${this.props.rowHeight}px`,
        }}
      >
        <svg width="100%" height="100%">
          <polyline
            points={`16,18 1,32 16,46`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
          <line
            x1="0%"
            y1="50%"
            x2="30px"
            y2="50%"
            stroke={this.DEFAULT_CLR}
            strokeWidth="3px"
          />
          <polyline
            points={`0,${this.props.rowHeight / 2} 30, ${
              this.props.rowHeight / 2
            } 30,0`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
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
      const height = dims[dims.length - 1].b - dims[1].t;
      innerContent = (
        <>
          {dims.map((d, i) => {
            if (i === dims.length - 1) {
              return this.renderArrow(d);
            }
            return this.renderDepEdge(d, i === 0);
          })}
          <div
            className="text-purple-400 font-sans w-6 text-base absolute text-nowrap flex align-middle"
            style={{
              height: `${height}px`,
              top: `${dims[0].t + (dims[0].b - dims[0].t) / 2}px`,
              left: `${dims[0].l + 32}px`,
            }}
          >
            <span
              className="flex justify-center"
              style={{ textOrientation: "mixed", writingMode: "vertical-rl" }}
            >
              relies on
            </span>
          </div>
        </>
      );
    }
    return (
      <div id="relies-on">
        <div className="absolute top-0 left-0 w-screen h-screen -z-10">
          {innerContent}
        </div>
      </div>
    );
  }
}
