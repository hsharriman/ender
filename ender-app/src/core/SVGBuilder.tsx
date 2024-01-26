import { CircleSVGProps, CircularArcSVGProps, LineSVGProps, PolylineSVGProps, QuadBezierSVGProps, TextSVGProps, Vector } from "./types";
import { vops } from "./vectorOps";

const SVG_SCALE = 20.;
const SVG_DIM = 200.;
const SVG_XSHIFT = 40;
const SVG_YSHIFT = 0;


export class SVGBuilder {
  content: JSX.Element[];
  constructor(content?: JSX.Element[]) {
    this.content = content ?? [];
  }

  addContent = (item: JSX.Element) => {
    if (this.content.find(elem => elem.key === item.key) === undefined) {
      this.content = this.content.concat(item);
    }
  }

  batchAdd = (items: JSX.Element[]) => {
    items.map(item => this.addContent(item));
  }

  contents = () => this.content;

  getExistingElement = (id: string) => {
    const matches = this.content.filter(item => item.key === id);
    if (matches.length > 1) { console.log("more than 1 match for id, ", id, matches)}
    return matches[0];
  }

  coordsToSvg = (coords: Vector, offset: Vector = [0, 0]): Vector => {
    // scale coordinates, shift and invert y axis
    // TODO scale the transformation based on canvas size
    let vec = vops.add(
      vops.smul(coords, SVG_SCALE),
      [SVG_XSHIFT + offset[0], SVG_YSHIFT + offset[1]]
    );
    return [vec[0], SVG_DIM-vec[1]];
  }

  scaleToSvg = (n: number) => n * SVG_SCALE;

  private polylinePathFromPts = (pts: Vector[]) => {
    let pointsStr = "";
    pts.map(v => {
      pointsStr = pointsStr + `${v[0]},${v[1]} `
    });
    return pointsStr;
  }

  addCircle = (props: CircleSVGProps) => {
    this.addContent(
      <circle
        cx={props.center[0]}
        cy={props.center[1]}
        r={props.r}
        key={props.key}
        style={props.style}
      />
    );
  }

  addLine = (props: LineSVGProps) => {
    this.addContent(
      <line 
        x1={props.start[0]}
        x2={props.end[0]}
        y1={props.start[1]}
        y2={props.end[1]}
        key={props.key}
        style={props.style}
      />
    );
  }

  addText = (props: TextSVGProps) => {
    this.addContent(
      <text 
        x={props.point[0]}
        y={props.point[1]}
        key={props.key}
        style={props.style}>
          {props.text}
      </text>
    );
  }

  addPolyline = (props: PolylineSVGProps) => {
    this.addContent(
      <polyline 
        points={this.polylinePathFromPts(props.points)}
        fill={props.fill}
        key={props.key}
        style={props.style}
      />
    );
  }

  addCircularArc = (props: CircularArcSVGProps) => {
    const {start, r, majorArc, sweep, end} = props;
    const pathStr = `M ${start[0]} ${start[1]} 
      A ${r} ${r} 0 ${majorArc} ${sweep} ${end[0]} ${end[1]}`;
    this.addContent(
      <path d={pathStr} key={props.key} style={props.style}/>
    );
  }

  addQuadraticBezier = (props: QuadBezierSVGProps) => {
    const {start, anchor, end} = props; 
    const pathStr = 
      `M ${start[0]} ${start[1]} Q ${anchor[0]} ${anchor[1]} ${end[0]} ${end[1]}`;
    this.addContent(
      <path d={pathStr} key={props.key} style={props.style}/>
    );
  }
}