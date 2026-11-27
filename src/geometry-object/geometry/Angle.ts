import { AngleProps } from "../types/geometryTypes";
import { Obj, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  public id: string;
  constructor(props: AngleProps) {
    super(Obj.Angle, props);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = new Set([
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ]);
    this.id = this.getId(Obj.Angle, this.label);
  }

  centerStr = () => {
    return this.center.label;
  };

  contains = (obj: Point | Segment) => {
    if (obj.tag === Obj.Point) {
      return Array.from(this.names).some((name) => name.includes(obj.label));
    } else {
      const segSet = new Set(obj.label.split(""));
      return (
        (segSet.has(this.start.label) || segSet.has(this.end.label)) &&
        segSet.has(this.center.label)
      );
    }
  };

  centerEquals = (pt: Point) => {
    return this.center.equals(pt);
  };

  addNames = (start: string, end: string) => {
    this.names.add(`${start}${this.center.label}${end}`);
    this.names.add(`${end}${this.center.label}${start}`);
  };

  sharedSide = (other: Angle) => {
    const thisPts = [this.start, this.center, this.end];
    const sharedPts = thisPts.filter((pt) => other.contains(pt));
    if (sharedPts.length !== 2) return undefined;

    const thisThird = thisPts.find((pt) => !sharedPts.includes(pt))!;
    const otherThird = [other.start, other.center, other.end].find(
      (pt) => !sharedPts.includes(pt),
    )!;
    return {
      shared: `${sharedPts[0].label}${sharedPts[1].label}`,
      thisThird: thisThird.label,
      otherThird: otherThird.label,
    };
  };

  getPoints = (): [Vector, Vector, Vector] => [
    this.start.pt,
    this.center.pt,
    this.end.pt,
  ];
}
