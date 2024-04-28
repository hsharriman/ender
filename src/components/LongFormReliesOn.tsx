import React from "react";
import { start } from "repl";

export interface LongReliesOnProps {
  reliesOn: string[];
  rowHeight: number;
  parentFrameId: string;
  rect: DOMRect;
}

interface LongReliesOnState {
  // parentRef: HTMLButtonElement | null;
  dims: Dims[];
}

interface Dims {
  l: number;
  t: number;
  b: number;
  key: string;
}

export class LongFormReliesOn extends React.Component<
  LongReliesOnProps,
  LongReliesOnState
> {
  private DEFAULT_CLR = "#D8B1FF";
  private SVG_WIDTH = 30;
  private L_SHIFT = "12.5rem";
  constructor(props: LongReliesOnProps) {
    super(props);
    this.state = {
      dims: [],
    };
  }

  buildGraph = () => {};

  getRowCoords = (frameKey: string): Dims | undefined => {
    return {
      l: this.props.rect.right,
      t: this.props.rect.top,
      b: this.props.rect.bottom,
      key: frameKey,
    };
  };

  vertDists = (numDeps: number): Dims[] => {
    let startCoords = this.getRowCoords(this.props.parentFrameId);
    let endCoords = [];
    if (startCoords) {
      startCoords = {
        ...startCoords,
        t: startCoords.t + (startCoords.b - startCoords.t) / 8,
        b: startCoords.b + (startCoords.b - startCoords.t) / 8,
      };
      let lastTop = startCoords.t;
      for (let i = 0; i < numDeps; i++) {
        let coords = {
          l: startCoords.l,
          t: lastTop - this.props.rowHeight,
          b: lastTop,
          key: `${this.props.parentFrameId}-${i + 1}`,
        };
        endCoords.push(coords);
        lastTop = coords.t;
      }
      if (endCoords.length > 0) {
        const tops = endCoords.sort((a, b) => a.t - b.t);
        tops.push(startCoords);
        this.updateDims(tops);
        return tops;
      }
    }
    this.updateDims([]);
    return [];
  };

  updateDims = (newDims: Dims[]) => {
    if (JSON.stringify(newDims) !== JSON.stringify(this.state.dims)) {
      this.setState({ dims: newDims });
    }
  };

  renderDepEdge = (d: Dims, text: string, highest: boolean = true) => {
    const divHeight = Math.round(d.b - d.t);
    const rightCoord = this.props.rowHeight;
    return (
      <div
        className="absolute flex flex-row gap-2 justify-end"
        style={{
          top: `${d.t}px`,
          left: `calc(${d.l}px - ${this.L_SHIFT})`,
          height: `${this.props.rowHeight}px`,
        }}
      >
        <div className="text-right text-purple-400 no-wrap w-48">{text}</div>
        <svg width={`${this.SVG_WIDTH}px`} height="100%">
          <circle r="5px" cx="5px" cy="50%" fill={this.DEFAULT_CLR} />
          <polyline
            points={`0,${this.props.rowHeight / 2} ${this.SVG_WIDTH - 2}, ${
              this.props.rowHeight / 2
            } ${this.SVG_WIDTH - 2}, ${this.props.rowHeight}`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
          {!highest && (
            <line
              x1={`${this.SVG_WIDTH - 2}px`}
              y1="0"
              x2={`${this.SVG_WIDTH - 2}px`}
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
    const h = this.props.rowHeight + 20;
    return (
      <div
        className="absolute w-8"
        style={{
          top: `${d.t}px`,
          // left: `calc(${d.l}px + ${this.L_SHIFT})`,
          left: `${d.l}px`,
          height: `${h}px`,
        }}
      >
        <svg width={`${this.SVG_WIDTH}px`} height="100%">
          <polyline
            points={`14,10 1,${h / 2} 14,${h - 10}`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
          <line
            x1="0%"
            y1={`${h / 2}px`}
            x2={`${this.SVG_WIDTH - 2}px`}
            y2={`${h / 2}px`}
            stroke={this.DEFAULT_CLR}
            strokeWidth="3px"
          />
          <polyline
            points={`0,${h / 2} ${this.SVG_WIDTH - 2}, ${h / 2} ${
              this.SVG_WIDTH - 2
            },0`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
        </svg>
      </div>
    );
  };

  render() {
    const dependsOn = this.props.reliesOn;
    let innerContent = <></>;
    if (dependsOn && dependsOn.length > 0) {
      const dims = this.vertDists(dependsOn.length);
      if (dims.length > 0) {
        const height = dims[dims.length - 1].b - dims[1].t;
        innerContent = (
          <>
            {dims.map((d, i) => {
              if (i === dims.length - 1) {
                return this.renderArrow(d);
              }
              return this.renderDepEdge(d, dependsOn[i], i === 0);
            })}
            <div
              className="text-purple-400 font-sans w-6 text-base absolute text-nowrap flex align-middle"
              style={{
                height: `${height}px`,
                top: `${dims[0].t - this.props.rowHeight + 4}px`,
                left: `calc(${dims[0].l + 48}px - ${this.L_SHIFT})`,
              }}
            >
              <span className="flex justify-center">Relies On:</span>
            </div>
          </>
        );
      }
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
