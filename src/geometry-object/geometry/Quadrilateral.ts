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
  typeOpts?: { type: "trapezoid" | "kite"; objs: [string, string] };

  constructor(props: QuadrilateralProps) {
    super(Obj.Quadrilateral, props);
    this.p = props.pts;

    this.label = Array.from(props.pts.map((pt) => pt.label))
      .sort()
      .join("");
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
    // Angles in cyclic vertex order [pts[0], pts[1], pts[2], pts[3]] so that
    // positions (0,2) and (1,3) are geometric opposites and adjacent positions
    // are consecutive — required for isOppositeAngles and isConsecutive.
    const aa = new Angle({
      start: pts[3],
      center: pts[0],
      end: pts[1],
      parentFrame,
    }); // angle at pts[0]
    const ab = new Angle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    }); // angle at pts[1]
    const ac = new Angle({
      start: pts[1],
      center: pts[2],
      end: pts[3],
      parentFrame,
    }); // angle at pts[2]
    const ad = new Angle({
      start: pts[2],
      center: pts[3],
      end: pts[0],
      parentFrame,
    }); // angle at pts[3]
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

  isDiagonal = (s: Segment) => {
    return this.diagonals().some((diag) => s.names.has(diag));
  };

  isOppositeSides = (s1: Segment, s2: Segment) => {
    const inOpp1 = (s: Segment) => this.s[0].equals(s) || this.s[2].equals(s);
    const inOpp2 = (s: Segment) => this.s[1].equals(s) || this.s[3].equals(s);
    return (
      !s1.equals(s2) &&
      ((inOpp1(s1) && inOpp1(s2)) || (inOpp2(s1) && inOpp2(s2)))
    );
  };

  isOppositeAngles = (a1: Angle, a2: Angle) => {
    const inOpp1 = (a: Angle) => this.a[0].equals(a) || this.a[2].equals(a);
    const inOpp2 = (a: Angle) => this.a[1].equals(a) || this.a[3].equals(a);
    return (
      !a1.equals(a2) &&
      ((inOpp1(a1) && inOpp1(a2)) || (inOpp2(a1) && inOpp2(a2)))
    );
  };

  isConsecutive = (o1: Segment | Angle, o2: Segment | Angle) => {
    const objArray = o1.tag === Obj.Segment ? this.s : this.a;
    const idx = objArray.findIndex((s) => s.equals(o1));
    if (idx === -1) return false;
    return (
      objArray[(idx + 1) % 4].equals(o2) || objArray[(idx + 3) % 4].equals(o2)
    );
  };

  consecutiveAngles = (ang: string): [Angle, Angle] | null => {
    const idx = this.a.findIndex((a) => a.names.has(ang));
    if (idx === -1) return null;
    return [this.a[(idx + 3) % 4], this.a[(idx + 1) % 4]]; // the angle before and after curr
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
    if (!this.a.some((a) => a.equals(a1)) || !this.a.some((a) => a.equals(a2)))
      return false;
    const trapBases = this.trapezoidBases();
    if (!trapBases) return false;
    const [b1, b2] = trapBases;
    const sharedSide = a1.sharedSide(a2);
    if (!sharedSide) return false;
    const rev = (s: string) => s.split("").reverse().join("");
    return (
      sharedSide.shared === b1 || sharedSide.shared === rev(b1) ||
      sharedSide.shared === b2 || sharedSide.shared === rev(b2)
    );
  };
}
