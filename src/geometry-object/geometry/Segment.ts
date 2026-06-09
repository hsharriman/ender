import { SegmentProps } from "../types/geometryTypes";
import { LSegment, Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";

export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  private subSegments: Set<Segment> = new Set();
  private parentSegment: Set<Segment> = new Set();
  constructor(props: SegmentProps) {
    super(Obj.Segment, props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.id =
      props.parentFrame !== undefined
        ? `${props.parentFrame}-${this.id}`
        : this.id;
    this.names = this.permutator([this.p1.label, this.p2.label]);
  }

  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  contains = (pt: Point) => {
    return this.label.includes(pt.label);
  };

  addSubSegment = (s: Segment) => {
    if (!this.subSegments.has(s)) {
      this.subSegments.add(s);
      s.addParentSegment(this);
    }
    return this;
  };

  addParentSegment = (s: Segment) => {
    if (!this.parentSegment.has(s)) {
      this.parentSegment.add(s);
      s.addSubSegment(this);
    }
    return this;
  };

  getSubSegments = () => this.subSegments;

  getParentSegments = () => this.parentSegment;

  isSubSegment = (s: Segment) => this.parentSegment.add(s);

  isParentSegment = (s: Segment) => this.subSegments.has(s);
}
