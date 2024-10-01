import React from "react";
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
  private SVGWIDTH = 30;
  private left = 10;

  getRowCoords = (frameKey: string): Dims | undefined => {
    // TODO make work for any row type
    const rowEle = document.getElementById(`prooftext-${frameKey}`);
    if (rowEle) {
      const rowRect = rowEle.getBoundingClientRect();
      return {
        l: rowRect.right + window.scrollX, // right side of row
        t: rowRect.top + window.scrollY, // top of row,
        b: rowRect.bottom + window.scrollY,
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

  renderDepEdge = (d: Dims, highest: boolean, lastBottom: number) => {
    const divHeight = Math.round(d.b - d.t);
    return (
      <div
        className="absolute w-8"
        style={{
          top: `${d.t}px`,
          left: `${d.l - this.left}px`,
          height: `${divHeight}px`,
        }}
      >
        <svg width="100%" height="100%">
          <circle r="5px" cx="5px" cy="50%" fill={this.DEFAULT_CLR} />
          <polyline
            points={`0,${this.props.rowHeight / 2} ${this.SVGWIDTH},${
              this.props.rowHeight / 2
            }`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
        </svg>
      </div>
    );
  };

  renderArrow = (d: Dims, lastBottom: number) => {
    // TODO make less absolutely calculated by pixel values + assumed row height
    const quarterRow = this.props.rowHeight / 4;
    const halfRow = this.props.rowHeight / 2;
    return (
      <div
        className="absolute w-8"
        id="relies-on-arrow"
        style={{
          top: `${d.t}px`,
          left: `${d.l - this.left}px`,
          height: `${this.props.rowHeight}px`,
        }}
      >
        <svg width="100%" height="100%">
          <polyline
            points={`${quarterRow},${quarterRow} 1,${halfRow} ${quarterRow},${
              3 * quarterRow
            }`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
          <line
            x1="0%"
            y1="50%"
            x2={`${this.SVGWIDTH}px`}
            y2="50%"
            stroke={this.DEFAULT_CLR}
            strokeWidth="3px"
          />
          <polyline
            points={`0,${this.props.rowHeight / 2} ${this.SVGWIDTH},${
              this.props.rowHeight / 2
            }`}
            stroke={this.DEFAULT_CLR}
            fill="none"
            strokeWidth="3px"
          />
        </svg>
      </div>
    );
  };

  renderFullConnector = (dims: Dims[]) => {
    let arrow = dims[0].t + this.props.rowHeight / 2;
    let end = dims[dims.length - 1].b - this.props.rowHeight / 2;
    let divHeight = Math.abs(arrow - end);
    return (
      <div
        className="absolute w-8"
        style={{
          top: `${Math.min(arrow, end)}px`,
          left: `${dims[0].l - this.left}px`,
          height: `${divHeight}px`,
        }}
      >
        <svg width="100%" height="100%">
          <line
            x1={`${this.SVGWIDTH}px`}
            x2={`${this.SVGWIDTH}px`}
            y1={0}
            y2={`${divHeight}px`}
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
    // TODO height of text div should always match the top/bottom of the relies on arrow
    if (dependsOn) {
      const dims = this.vertDists();
      const height = dims[dims.length - 1].b - dims[0].t;

      let lastBottom = dims[0].b;
      const svgs = dims.map((d, i) => {
        if (i === dims.length - 1) {
          return this.renderArrow(d, lastBottom);
        }
        const svg = this.renderDepEdge(d, i === 0, lastBottom);
        lastBottom = d.b;
        return svg;
      });
      innerContent = (
        <div>
          {this.renderFullConnector(dims)}
          {svgs}
          <div
            className="text-purple-400 font-notoSans w-6 text-base absolute text-nowrap flex align-middle"
            style={{
              height: `${height}px`,
              top: `${dims[0].t}px`,
              left: `${dims[0].l - this.left + 32}px`,
            }}
          >
            <span
              className="flex justify-center"
              style={{ textOrientation: "mixed", writingMode: "vertical-rl" }}
            >
              relies on
            </span>
          </div>
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
