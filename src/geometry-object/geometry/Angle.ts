import { AngleProps } from "../types/geometryTypes";
import { LAngle, Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  public id: string;
  private parentAngle: Angle | null = null;
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

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  centerStr = () => {
    return this.center.label;
  };

  // Returns the first name in this angle's names set for which check passes,
  // or null if none pass. Use this to resolve an angle label to one that a
  // geometric object (triangle, quad, transversal) actually recognises when
  // the raw label is an overlapping/containing variant.
  resolveLabel = (check: (label: string) => boolean): string | null => {
    for (const name of this.names) {
      if (check(name)) return name;
    }
    return null;
  };

  // Returns true if pt's label appears as the start or end (not center) in
  // any name variant. Handles intermediate-point angle references like
  // a_EGM where M is on ray GD: addNames populates overlap-merged variants
  // into this.names during premises setup so M appears at position 0 or 2.
  angleRayContains = (pt: Point): boolean => {
    return Array.from(this.names).some(
      (name) => name[0] === pt.label || name[2] === pt.label,
    );
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

  addParentAngle = (a: Angle) => {
    this.parentAngle = a;
    return this;
  };

  getParentAngle = () => {
    return this.parentAngle;
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

  getPts = () => [this.start, this.center, this.end];

  endpointsEqual = (other: Angle) => {
    return (
      (this.start.equals(other.start) && this.end.equals(other.end)) ||
      (this.start.equals(other.end) && this.end.equals(other.start))
    );
  };
}
