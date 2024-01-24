import { Vector } from "../../core/vectorOps";

const SVG_SCALE = 20.;
const SVG_DIM = 200.;
const SVG_XSHIFT = 40;
const SVG_YSHIFT = 0;
const SVG_URL = "http://www.w3.org/2000/svg"; 

export type LabeledPoint = {pt: Vector, label: string};

enum ObjectType {
  Point = "point",
  Segment = "segment",
  // Text,
  // Circle,
  // AngleArc,
  // RightAngle,
  // ParallelTick,
  // EqualLengthTick,
}
const coordsToSvg = ([x,y]: Vector): Vector => {
  // scale coordinates, shift and invert y axis
  // TODO scale the transformation based on canvas size
  return [x*SVG_SCALE + SVG_XSHIFT, (SVG_DIM-SVG_YSHIFT)-(y*SVG_SCALE)];
}

export class Euclidean {
  private svgId: string;
  constructor(svgIdSuffix: string) {
    this.svgId = `svg-object-${svgIdSuffix}`;
  }
  getExistingElement = (id: string) => {
    const parent = document.getElementById(this.svgId);
    if (parent) {
      const children = parent.children;
      return children.namedItem(id);
    }
  }

  getId = (objectType: ObjectType, label: string) => {
    const alphabetizedLabel = Array.from(label).sort().toString();
    return `${objectType}.${alphabetizedLabel}`;
  }

  point = (p: LabeledPoint) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Point, p.label);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      const parent = document.getElementById(this.svgId);
      if (parent) {
        const [cx, cy] = coordsToSvg(p.pt);
        var circle = document.createElementNS(SVG_URL, 'circle');
        circle.setAttributeNS(null, 'cx', `${cx}`);
        circle.setAttributeNS(null, 'cy', `${cy}`);
        circle.setAttributeNS(null, 'r', '2');
        circle.style.fill = 'black';
        circle.id = id;
        parent.appendChild(circle);
      }
    }
  }

  segment = (p1: LabeledPoint, p2: LabeledPoint) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Segment, `${p1.label}${p2.label}`);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      const parent = document.getElementById(this.svgId);
      if (parent) {
        const [x1, y1] = coordsToSvg(p1.pt);
        const [x2, y2] = coordsToSvg(p2.pt);
        var line = document.createElementNS(SVG_URL, 'line');
        line.setAttributeNS(null, 'x1', `${x1}`);
        line.setAttributeNS(null, 'y1', `${y1}`);
        line.setAttributeNS(null, 'x2', `${x2}`);
        line.setAttributeNS(null, 'y2', `${y2}`);
        line.style.strokeWidth = '1px';
        line.style.stroke = "black";
        line.id = id;
        parent.appendChild(line);
      }
    }
  }

  label = (pos: Vector, label:string) => {
    // TODO
    return <textPath></textPath>;
  }

  triangle = (p1: LabeledPoint, p2: LabeledPoint, p3: LabeledPoint) => {
    [p1, p2, p3].map(p => this.point(p));
    [[p1, p2], [p2, p3], [p1, p3]].forEach(pair => this.segment(pair[0], pair[1]));
  }
}