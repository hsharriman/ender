import { TriangleProps } from "../types/geometryTypes";
import { Obj, ParseObj } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

/**
 * A triangle's vertex order is fixed at construction and carries no meaning
 * beyond naming. Congruence correspondence lives on the proof step that
 * established it (`TriCorrespondence`), because one triangle may pair with
 * several others under different correspondences.
 */
export class Triangle extends BaseGeometryObject {
  s: [Segment, Segment, Segment];
  a: [Angle, Angle, Angle];
  p: [Point, Point, Point];
  readonly id: string;

  constructor(props: TriangleProps) {
    super(Obj.Triangle, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
    this.label = `${props.pts[0].label}${props.pts[1].label}${props.pts[2].label}`;

    this.id = this.getId(Obj.Triangle, this.label);
  }

  private buildSegments = (
    pts: Point[],
    parentFrame?: string,
  ): [Segment, Segment, Segment] => {
    const sa = new Segment({
      p1: pts[0],
      p2: pts[1],
      parentFrame,
    });
    const sb = new Segment({
      p1: pts[0],
      p2: pts[2],
      parentFrame,
    });
    const sc = new Segment({
      p1: pts[1],
      p2: pts[2],
      parentFrame,
    });

    return [sa, sb, sc];
  };

  private buildAngles = (
    pts: Point[],
    parentFrame?: string,
  ): [Angle, Angle, Angle] => {
    const aa = new Angle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    });
    const ab = new Angle({
      start: pts[1],
      center: pts[0],
      end: pts[2],
      parentFrame,
    });
    const ac = new Angle({
      start: pts[0],
      center: pts[2],
      end: pts[1],
      parentFrame,
    });
    return [aa, ab, ac];
  };

  /**
   * True when `p` lists each of this triangle's three vertices exactly once.
   *
   * A congruence reason derives a vertex pairing from its congruent-part pairs.
   * When those pairs reuse a side or an angle, the derived triple repeats a
   * point or names a point this triangle does not own. Such a triple describes
   * no correspondence, so the reason must reject it.
   */
  isVertexPermutation = (p: [string, string, string]) => {
    const own = this.p.map((pt) => pt.label);
    return new Set(p).size === 3 && p.every((label) => own.includes(label));
  };

  getThirdPoint = (p1: string, p2: string) => {
    const remaining = this.label.replace(p1, "").replace(p2, "");
    return remaining;
  };

  getAngleByCenter = (center: string) => {
    return this.a.find(
      (ang) => ang.center.label.toLowerCase() === center.toLowerCase(),
    );
  };

  containsParseObj = (obj: ParseObj) => {
    if (obj.type === Obj.Segment) {
      return this.s.some((seg) => seg.names.has(obj.v));
    } else if (obj.type === Obj.Angle) {
      return this.a.some((ang) => ang.names.has(obj.v));
    }
    return false;
  };

  contains = (obj: Segment | Angle) => {
    if (obj.tag === Obj.Segment) {
      return this.s.some((seg) => seg.equals(obj as Segment));
    } else {
      return this.a.some((ang) => ang.equals(obj as Angle));
    }
  };

  hasUniqueAngs = (a1: string, a2: string, a3: string) => {
    const aArr = Array.from(this.a);
    for (let ang of [a1, a2, a3]) {
      const idx = aArr.findIndex((a) => a.names.has(ang));
      if (idx < 0) return false;
      aArr.splice(idx, 1);
    }
    return aArr.length === 0;
  };

  hasUniqueSegs = (s1: string, s2: string, s3: string) => {
    const sArr = Array.from(this.s);
    for (let seg of [s1, s2, s3]) {
      const idx = sArr.findIndex((s) => s.names.has(seg));
      if (idx < 0) return false;
      sArr.splice(idx, 1);
    }
    return sArr.length === 0;
  };
}
