import { Vector, vops } from "./vectorOps";

export type GeometryProps = {
  names?: string[];
}

export class GeometryObject {
  public readonly names: string[] | undefined;
  constructor(props: GeometryProps) {
    this.names = props.names;
  }

  // pts getter/setters?
}

export type PointProps = {
  pt: [number, number];
  label: string;
  // id?
} & GeometryProps;

export class Point extends GeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly label: string;
  constructor(props: PointProps) {
    super(props);
    this.pt = props.pt;
    this.label = props.label;
  }

  // equals = (p: Point) => this.vec.equals(p.vec);

  // returns euclidean distance between 2 points
  dist = (p: Point) => {
    console.log("euclidean: ", Math.sqrt(Math.pow(this.pt[0]-p.pt[0], 2) + Math.pow(this.pt[1]-p.pt[1], 2)));
    console.log("vector", vops.mag(this.sub(p)));
    return vops.mag(this.sub(p));
  } 
  magnitude = () => vops.mag(this.pt);
  unit = () => vops.unit(this.pt);
  equals = (v: Point) => vops.equals(this.pt, v.pt);
  add = (v: Point) => vops.add(this.pt, v.pt);
  sub = (v: Point) => vops.sub(this.pt, v.pt);
}

export type SegmentProps = {
  p1: Point;
  p2: Point;
  // id?
} & GeometryProps;
export class Segment extends GeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public label: string;
  private parallel: number;
  private equalMark: number;
  constructor(props: SegmentProps) {
    super(props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${props.p1.label}${props.p2.label}`;
    this.parallel = 0;
    this.equalMark = 0;
  }

  length = () => {
    return this.p1.dist(this.p2);
  }

  unitVec = () => {
    return vops.unit(this.p2.sub(this.p1));
  }

  midPoint = () => {}
  
  isParallel = (s: Segment) => {}
  isPerpendicular = (s: Segment) => {}

  setParallel = (marked: number) => {this.parallel = marked;}
  getParallel = () => this.parallel;
  setEqualMark = (marked: number) => {this.equalMark = marked; }
  getEqualMark = () => this.equalMark;
  isEqualMark = () => this.equalMark === 0;
}

// whether to take the larger or smaller of 2 angles
export enum AngleSize {
  Min,
  Max,
}

export type AngleProps = {
  p1: Point;
  p2: Point;
  p3: Point;
  size: AngleSize;
} & GeometryProps;

export class Angle extends GeometryObject {
  // need 3 points and concavity/direction
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly p3: Point;
  public readonly size: AngleSize; // TODO rename
  public label: string;
  private equalMark: number;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.p3 = props.p3;
    this.size = props.size;
    this.equalMark = 0;
    this.label = `${props.p1.label}${props.p2.label}${props.p3.label}`
  }

  setEqualMark = (marked: number) => {this.equalMark = marked; }
  getEqualMark = () => this.equalMark;
  isEqualMark = () => this.equalMark === 0;
}

export type TriangleProps = {
  p1: Point;
  p2: Point;
  p3: Point;
  // add things like type of triangle, isos, right, etc.
} & GeometryProps;
export class Triangle extends GeometryObject {
  public readonly pts: [Point,Point,Point];
  public readonly segs: [Segment, Segment, Segment];
  public readonly angs: [Angle, Angle, Angle];
  constructor(props: TriangleProps) {
    super(props);
    this.pts = [props.p1, props.p2, props.p3];
    // TODO replace all of these constructors with
    // findOrCreate methods
    this.segs = [
      new Segment({
        p1: props.p1,
        p2: props.p2,
      }),
      new Segment({
        p1: props.p2,
        p2: props.p3,
      }),
      new Segment({
        p1: props.p3,
        p2: props.p1,
      })
    ];
    this.angs = [
      new Angle({
        p1: props.p1, 
        p2: props.p2, 
        p3: props.p3, 
        size: AngleSize.Min
      }),
      new Angle({
        p1: props.p2, 
        p2: props.p3, 
        p3: props.p1, 
        size: AngleSize.Min
      }),
      new Angle({
        p1: props.p3, 
        p2: props.p1, 
        p3: props.p2, 
        size: AngleSize.Min
      }),
    ];
  }
  // 3 points, type of triangle
  // type of triangle may just be a constraint
}

class Quadrilateral extends GeometryObject {
  // 4 points and type of quadrilateral
  // type of quad can be a constraint not a prop
}

class Circle extends GeometryObject {
  // radius of circle, internally track center
}

class Oval extends GeometryObject {} //? maybe

class Pentagon extends GeometryObject {}

class RegularNGon extends GeometryObject {}

class Polygon extends GeometryObject {}