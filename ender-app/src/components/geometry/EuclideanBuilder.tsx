import { Vector, vops } from "../../core/vectorOps";

const SVG_SCALE = 20.;
const SVG_DIM = 200.;
const SVG_XSHIFT = 40;
const SVG_YSHIFT = 0;
const SVG_URL = "http://www.w3.org/2000/svg"; 

// TODO redundant with other files
export type LabeledPoint = {pt: Vector, label: string};

enum ObjectType {
  Point = "point",
  Segment = "segment",
  Text = "text",
  // Circle,
  // AngleArc,
  // RightAngle,
  ParallelTick = "parallel",
  // EqualLengthTick,
}
const coordsToSvg = (coords: Vector, offset: Vector = [0, 0]): Vector => {
  // scale coordinates, shift and invert y axis
  // TODO scale the transformation based on canvas size
  let vec = vops.add(
    vops.smul(coords, SVG_SCALE),
    [SVG_XSHIFT + offset[0], SVG_YSHIFT + offset[1]]
  );
  return [vec[0], SVG_DIM-vec[1]];
}

const polylinePathFromPts = (pts: Vector[]) => {
  let pointsStr = "";
  pts.map(v => {
    pointsStr = pointsStr + `${v[0]},${v[1]} `
  });
  return pointsStr;
}

export class EuclideanBuilder {
  content: JSX.Element[];
  constructor(content?: JSX.Element[]) {
    this.content = content ?? [];
  }

  addContent = (item: JSX.Element) => {
    this.content = this.content.concat(item);
  }

  contents = () => this.content;

  getExistingElement = (id: string) => {
    const matches = this.content.filter(item => item.key === id);
    if (matches.length > 0) { console.log("more than 1 match for id, ", id, matches)}
    return matches[0];
  }

  getId = (objectType: ObjectType, label: string) => {
    // TODO might need to add some iterator for number of ticks as well
    const alphabetizedLabel = Array.from(label).sort().toString();
    return `${objectType}.${alphabetizedLabel}`;
  }

  point = (p: LabeledPoint, labeled?: boolean) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Point, p.label);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      const [cx, cy] = coordsToSvg(p.pt);
      this.addContent(
        <circle
          cx={cx}
          cy={cy}
          r={2}
          key={id}
          style={{fill: "black"}}
        />
      );
      if (labeled) {
        this.label(p.pt, p.label);
      }
    }
  }

  segment = (p1: LabeledPoint, p2: LabeledPoint) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Segment, `${p1.label}${p2.label}`);
    if (!this.getExistingElement(id)) {
      // element not found, add it
        const [x1, y1] = coordsToSvg(p1.pt);
        const [x2, y2] = coordsToSvg(p2.pt);
        this.addContent(
          <line 
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
            key={id}
            style={{stroke: "black", strokeWidth: "1px"}}
          />
        );
    }
  }

  label = (pos: Vector, label: string, offset: Vector = [3, 3]) => {
      const [cx, cy] = coordsToSvg(pos, offset);
      this.addContent(
        <text x={cx} y={cy} key={this.getId(ObjectType.Text, label)} style={{font: "12px sans-serif"}}>
          {label}
        </text>
      );
  }

  parallelMark = ([p1, p2]: [LabeledPoint, LabeledPoint], numTicks: number) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(p1.pt, p2.pt), 2);

    // TODO make direction face "positive direction"?
    // TODO, customize scaling of dir
    // 2 endpoints of the chevron, rotated to match segment
    const dir = vops.smul(vops.unit(vops.sub(p2.pt, p1.pt)), 0.5);
    const startDir = vops.add(vops.rot(dir, 135), midpoint);
    const endDir = vops.add(vops.rot(dir, 225), midpoint);

    // if odd number of ticks, start at midpoint 
    let points = [startDir, midpoint, endDir];
    // TODO account for number of ticks
    if (numTicks % 2 !== 0) {
      points = points.map(v => coordsToSvg(v));
    } else {
      // TODO offset
      points = points.map(v => coordsToSvg(v));
    }

    // build svg polyline of chevron
    let path = document.createElementNS(SVG_URL, "polyline");
    path.setAttributeNS(null, "points", polylinePathFromPts(points));
    path.setAttributeNS(null, "fill", "none");
    path.style.strokeWidth = "1px";
    path.style.stroke = "black";
    const id = this.getId(ObjectType.ParallelTick, `${p1.label}${p2.label}.${numTicks}`); // TODO numTicks is temp, should change
    this.addContent(
      <polyline 
        points={polylinePathFromPts(points)}
        fill="none"
        key={id}
        style={{stroke: "black", strokeWidth: "1px"}}
      />
    );
  }

  triangle = (pts: [LabeledPoint, LabeledPoint, LabeledPoint]) => {
    pts.map(p => this.point(p, true));
    [[pts[0], pts[1]], [pts[1], pts[2]], [pts[0], pts[2]]]
      .forEach(pair => this.segment(pair[0], pair[1]));
  }

}