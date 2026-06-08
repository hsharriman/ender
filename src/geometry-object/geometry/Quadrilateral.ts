import { QuadrilateralProps } from "../types/geometryTypes";
import { Obj } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export class Quadrilateral extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle, Angle];
  readonly p: [Point, Point, Point, Point];
  readonly typeOpts?: { type: "trapezoid" | "kite"; objs: [string, string] };

  constructor(props: QuadrilateralProps) {
    super(Obj.Quadrilateral, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, props.parentFrame);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, props.parentFrame);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
    if (props.typeOpts) {
      const { type, objs } = props.typeOpts;
      this.typeOpts = { type, objs };
    }
  }

  private buildSegments = (
    pts: Point[],
    parentFrame?: string,
  ): [Segment, Segment, Segment, Segment] => {
    const sa = new Segment({
      p1: pts[0],
      p2: pts[1],
      parentFrame,
    });
    const sb = new Segment({
      p1: pts[1],
      p2: pts[2],
      parentFrame,
    });
    const sc = new Segment({
      p1: pts[2],
      p2: pts[3],
      parentFrame,
    });
    const sd = new Segment({
      p1: pts[3],
      p2: pts[0],
      parentFrame,
    });
    return [sa, sb, sc, sd];
  };

  private buildAngles = (
    pts: Point[],
    parentFrame?: string,
  ): [Angle, Angle, Angle, Angle] => {
    const aa = new Angle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    });
    const ab = new Angle({
      start: pts[1],
      center: pts[2],
      end: pts[3],
      parentFrame,
    });
    const ac = new Angle({
      start: pts[3],
      center: pts[0],
      end: pts[1],
      parentFrame,
    });
    const ad = new Angle({
      start: pts[2],
      center: pts[3],
      end: pts[0],
      parentFrame,
    });
    return [aa, ab, ac, ad];
  };

  contains = (s: Segment | Angle | Point) => {
    if (s.tag === Obj.Segment) {
      return this.s.some((seg) => seg.equals(s as Segment));
    } else if (s.tag === Obj.Angle) {
      return this.a.some((ang) => ang.equals(s as Angle));
    } else if (s.tag === Obj.Point) {
      return this.p.some((pt) => pt.equals(s as Point));
    }
    return false;
  };

  diagonals = (): [string, string] => {
    return [
      `${this.p[0].label}${this.p[2].label}`,
      `${this.p[1].label}${this.p[3].label}`,
    ];
  };

  isOppositeSides = (s1: Segment, s2: Segment) => {
    const opp1Set = new Set([this.s[0].label, this.s[2].label]);
    const opp2Set = new Set([this.s[1].label, this.s[3].label]);
    return (
      !s1.equals(s2) &&
      ((opp1Set.has(s1.label) && opp1Set.has(s2.label)) ||
        (opp2Set.has(s1.label) && opp2Set.has(s2.label)))
    );
  };

  isOppositeAngles = (a1: Angle, a2: Angle) => {
    const opp1Set = new Set([this.a[0].label, this.a[2].label]);
    const opp2Set = new Set([this.a[1].label, this.a[3].label]);
    return (
      !a1.equals(a2) &&
      ((opp1Set.has(a1.label) && opp1Set.has(a2.label)) ||
        (opp2Set.has(a1.label) && opp2Set.has(a2.label)))
    );
  };

  consecutiveAngles = (ang: string): [Angle, Angle] | null => {
    const idx = this.a.findIndex((a) => a.label === ang);
    if (idx === -1) return null;
    return [this.a[idx], this.a[(idx + 1) % 4]];
  };

  trapezoidBases = (): [string, string] | null => {
    if (this.typeOpts?.type !== "trapezoid") return null;
    const [base1, base2] = this.typeOpts.objs;
    return [base1, base2];
  };

  kiteAngles = (): [string, string] | null => {
    if (this.typeOpts?.type !== "kite") return null;
    const [ang1, ang2] = this.typeOpts.objs;
    return [ang1, ang2];
  };

  isBaseAnglePair = (a1: Angle, a2: Angle) => {
    const consecutive = this.consecutiveAngles(a1.label);
    const trapBases = this.trapezoidBases();
    if (!consecutive || !trapBases) return false;
    const [b1, b2] = trapBases;
    // base angles must have a shared side that is one of the 2 base segments
    const sharedSide = a1.sharedSide(a2);
    if (!sharedSide || (sharedSide.shared !== b1 && sharedSide.shared !== b2)) {
      return false;
    }
    return true;
  };
}
