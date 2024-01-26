import { Content } from "./objgraph";
import { Vector, Obj, LAngle, LSegment, LPoint } from "./types";

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: string[] = [];
  public label: string = "";
  constructor(tag: Obj) {
    this.tag = tag;
  }

  // https://stackoverflow.com/questions/9960908/permutations-in-javascript
  permutator = (inputArr: string[]): string[] => {
    let result: string[] = [];
    const permute = (arr: string[], m: string = "") => {
      if (arr.length === 0) {
        result.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice(); // copy arr
          let next = curr.splice(i, 1);
          permute(curr.slice(), m + next);
        }
      }
    };
    permute(inputArr);
    return result;
  };

  matches = (name: string) => this.names.find((n) => n === name) !== undefined;
}

export type PointProps = {
  pt: [number, number];
  label: string;
};

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  constructor(props: PointProps) {
    super(Obj.Point);
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };
}

export type SegmentProps = {
  p1: Point;
  p2: Point;
};
export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: LPoint;
  public readonly p2: LPoint;
  private parallel: number;
  private equalMark: number;
  constructor(props: SegmentProps) {
    super(Obj.Segment);
    this.p1 = props.p1.labeled();
    this.p2 = props.p2.labeled();
    this.label = `${this.p1.label}${this.p2.label}`;
    this.parallel = 0;
    this.equalMark = 0;
    this.names = this.permutator([this.p1.label, this.p2.label]);
  }

  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  getLabeledPts = (): [LPoint, LPoint] => [this.p1, this.p2];

  // TODO everything below this is useless atm
  isParallel = (s: Segment) => {};
  isPerpendicular = (s: Segment) => {};

  setParallel = (marked: number) => {
    this.parallel = marked;
  };
  getParallel = () => this.parallel;
  setEqualMark = (marked: number) => {
    this.equalMark = marked;
  };
  getEqualMark = () => this.equalMark;
  isEqualMark = () => this.equalMark === 0;
}

export type AngleProps = {
  start: Point;
  center: Point;
  end: Point;
};
export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  private equalMark: number;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(Obj.Angle);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.equalMark = 0;
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = [
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ];
  }

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  // TODO code not being used atm
  setEqualMark = (marked: number) => {
    this.equalMark = marked;
  };
  getEqualMark = () => this.equalMark;
  isEqualMark = () => this.equalMark === 0;
}

export type TriangleProps = {
  pts: [Point, Point, Point];
  // add things like type of triangle, isos, right, etc.
};
export class Triangle extends BaseGeometryObject {
  readonly s: [LSegment, LSegment, LSegment];
  readonly a: [LAngle, LAngle, LAngle];
  readonly p: [LPoint, LPoint, LPoint];

  constructor(props: TriangleProps, ctx: Content) {
    super(Obj.Triangle);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, ctx);
    this.p = [
      props.pts[0].labeled(),
      props.pts[1].labeled(),
      props.pts[2].labeled(),
    ];
    this.a = this.buildAngles(props.pts, ctx);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
  }

  private buildSegments = (
    pts: Point[],
    ctx: Content
  ): [LSegment, LSegment, LSegment] => {
    const sa = ctx.push(new Segment({ p1: pts[0], p2: pts[1] }));
    const sb = ctx.push(new Segment({ p1: pts[0], p2: pts[2] }));
    const sc = ctx.push(new Segment({ p1: pts[1], p2: pts[2] }));
    return [sa.labeled(), sb.labeled(), sc.labeled()];
  };

  private buildAngles = (
    pts: Point[],
    ctx: Content
  ): [LAngle, LAngle, LAngle] => {
    const aa = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[1],
        end: pts[2],
      })
    );
    const ab = ctx.push(
      new Angle({
        start: pts[1],
        center: pts[0],
        end: pts[2],
      })
    );
    const ac = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[2],
        end: pts[1],
      })
    );
    return [aa.labeled(), ab.labeled(), ac.labeled()];
  };

  // type of triangle may just be a constraint
  isosceles = (s1: Segment, s2: Segment) => {
    // TODO
  };
}

class Quadrilateral extends BaseGeometryObject {
  // 4 points and type of quadrilateral
  // type of quad can be a constraint not a prop
}

class Circle extends BaseGeometryObject {
  // radius of circle, internally track center
}

class Oval extends BaseGeometryObject {} //? maybe

class Pentagon extends BaseGeometryObject {}

class RegularNGon extends BaseGeometryObject {}

class Polygon extends BaseGeometryObject {}
