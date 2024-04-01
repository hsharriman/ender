import { LinkedText } from "../components/LinkedText";
import { Content } from "./objgraph";
import { BaseSVG } from "./svg/BaseSVG";
import { SVGCircle } from "./svg/SVGCircle";
import { SVGCurve } from "./svg/SVGCurve";
import { SVGLine } from "./svg/SVGLine";
import { SVGPolyline } from "./svg/SVGPolyline";
import { SVGText } from "./svg/SVGText";
import { SVGObj } from "./svg/svgTypes";
import { Vector, Obj, LAngle, LSegment, LPoint, TickType } from "./types";
import { vops } from "./vectorOps";

const SVG_SCALE = 20;
const SVG_DIM = 200;
const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 8;
const SVG_XSHIFT = 40;
const SVG_YSHIFT = 0;
const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.4;
const ARC_PADDING = 0.2;

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

  // From EuclideanBuilder SVG Related
  coordsToSvg = (coords: Vector, offset: Vector = [0, 0]): Vector => {
    // scale coordinates, shift and invert y axis
    // TODO scale the transformation based on canvas size
    let vec = vops.add(vops.smul(coords, SVG_SCALE), [
      SVG_XSHIFT + offset[0],
      SVG_YSHIFT + offset[1],
    ]);
    return [vec[0], SVG_DIM - vec[1]];
  };

  scaleToSvg = (n: number) => n * SVG_SCALE;

  getId = (objectType: Obj, label: string, tickNumber?: number) => {
    if (objectType === Obj.Angle) {
      const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
      label = `${label[1]}-${endPts}`;
    } else {
      label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  };

  // method to check whether ticks should be included in the render or not
}

export type PointProps = {
  pt: [number, number];
  label: string;
};

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  constructor(props: PointProps) {
    super(Obj.Point);
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
    this.id = this.getId(Obj.Point, this.label);
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  isEqual = (p: LPoint) => {
    return this.label === p.label && vops.eq(this.pt, p.pt);
  };

  svg = (labeled: boolean = true, style?: React.CSSProperties) => {
    let svgItems: BaseSVG[] = [
      new SVGCircle({
        center: this.coordsToSvg(this.pt),
        r: 2,
        key: this.id,
        style: {
          fill: "black",
          ...style,
        },
      }),
    ];
    if (labeled) svgItems.push(this.addLabel());
    return svgItems;
  };

  addLabel = (offset: Vector = [3, 3], style?: React.CSSProperties) => {
    return new SVGText({
      point: this.coordsToSvg(this.pt, offset),
      key: this.getId(Obj.Text, this.label),
      text: this.label,
      style: {
        font: "12px sans-serif",
        ...style,
      },
    });
  };
}

export type SegmentProps = {
  p1: Point;
  p2: Point;
};
export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  private ticks: Tick | undefined;
  constructor(props: SegmentProps) {
    super(Obj.Segment);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
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

  parallel = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.ParallelTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  equalLengthMark = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.EqualLengthTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    const ele = document.getElementById(this.id);
    setStyle(ele);
    if (this.ticks)
      this.ticks.getLabels().map((id) => {
        setStyle(document.getElementById(id));
      });
  };

  //Does not check whether the object already exists in DOM, just returns the SVG
  svg = (frameIdx: number, style?: React.CSSProperties) => {
    let svgItems: BaseSVG[] = [];
    if (this.ticks) {
      svgItems.push(...this.ticks.svg(frameIdx, style));
    }
    // add points
    svgItems.push(...this.p1.svg());
    svgItems.push(...this.p2.svg());
    // add line
    svgItems.push(
      new SVGLine({
        start: this.coordsToSvg(this.p1.pt),
        end: this.coordsToSvg(this.p2.pt),
        key: this.id,
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
        },
      })
    );
    return svgItems;
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Segment}
      />
    );
  };
}

export type TickProps = {
  type: TickType;
  num: number;
  start: number;
  end?: number;
  parent: LSegment | LAngle;
};
export class Tick extends BaseGeometryObject {
  // 1 segment and type of tick
  public readonly type: TickType;
  public readonly num: number;
  public readonly start: number;
  parent: LSegment | LAngle;
  ids: string[];
  constructor(props: TickProps) {
    super(props.type);
    this.type = props.type;
    this.num = props.num;
    this.start = props.start;
    this.parent = props.parent;
    this.ids = [];
  }

  getLabels = () => {
    const labels = [];
    for (let i = 0; i < this.num; i++) {
      labels.push(this.getId(this.type, this.parent.label, i));
    }
    console.log("labels", this.type, labels);
    // TODO this only works for equalMark and parallel bc angles have different format
    return labels;
  };

  svg = (frameIdx: number, style?: React.CSSProperties): BaseSVG[] => {
    // frame-specific render-logic
    if (frameIdx >= this.start) {
      if (this.type === Obj.ParallelTick) {
        // makes all parallel ticks at once for 1 segment
        return this.parallelMark(this.parent as LSegment, style);
      } else if (this.type === Obj.EqualLengthTick) {
        return this.equalLength(this.parent as LSegment, style);
      } else if (this.type === Obj.EqualAngleTick) {
        return this.equalAngle(this.parent as LAngle, style);
      }
    }
    return [
      new BaseSVG(
        {
          key: this.ids[0],
          style: { display: "none" },
        },
        SVGObj.Line
      ),
    ];
  };

  parallelMark = (s: LSegment, style?: React.CSSProperties) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);

    // TODO make direction face "positive direction"?
    // TODO, customize scaling of seg
    // 2 endpoints of the chevron, rotated to match segment
    const unit = vops.unit(vops.sub(s.p2, s.p1));
    const seg = vops.smul(unit, 0.5);
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(unit, this.num);
    return tickVectors.map((shift, i) => {
      const polyPts = points.map((v) => this.coordsToSvg(vops.add(v, shift)));
      const id = this.getId(Obj.ParallelTick, s.label, i);
      this.ids.push(id);
      // build svg polyline of chevron
      return new SVGPolyline({
        points: polyPts,
        key: id,
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
          fill: "none",
        },
      });
    });
  };

  equalLength = (s: LSegment, style?: React.CSSProperties) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);
    const unit = vops.unit(vops.sub(s.p2, s.p1));

    // segments to make up the tick mark
    const seg = vops.rot(vops.smul(unit, 0.25), 90);
    const start = vops.add(seg, midpoint);
    const end = vops.add(vops.smul(seg, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    const tickVectors = this.tickPlacement(unit, this.num);
    return tickVectors.map((shift, i) => {
      const id = this.getId(Obj.EqualLengthTick, s.label, i);
      this.ids.push(id);
      return new SVGLine({
        start: this.coordsToSvg(vops.add(start, shift)),
        end: this.coordsToSvg(vops.add(end, shift)),
        key: id,
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
        },
      });
    });
  };

  equalAngle = (a: LAngle, style?: React.CSSProperties) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    let ticks = [];
    // increase radius according to numticks
    for (let i = 0; i < this.num; i++) {
      const scalar = ARC_RADIUS + ARC_PADDING * i;
      const radius = ARC_RADIUS + this.scaleToSvg(ARC_PADDING * (i + 1));
      const id = this.getId(Obj.Angle, a.label, i);
      this.ids.push(id);
      ticks.push(
        new SVGCurve({
          r: radius,
          end: this.coordsToSvg(vops.add(a.center, vops.smul(eUnit, scalar))),
          start: this.coordsToSvg(vops.add(a.center, vops.smul(sUnit, scalar))),
          majorArc: 0,
          sweep: sweep,
          key: id,
          style: {
            stroke: "black",
            strokeWidth: "1px",
            fill: "none",
            ...style,
          },
        })
      );
    }
    return ticks;
  };

  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  protected tickPlacement = (unit: Vector, numTicks: number): Vector[] => {
    let dir = 1;
    const even = numTicks % 2 === 0;
    let shifts = even ? [TICK_PADDING / 2] : [0];
    for (let i = 1; i < numTicks; i++) {
      if (even && i === 1) dir = -1;
      const shift =
        i % 2 === 0 ? TICK_PADDING * i * (-1 * dir) : TICK_PADDING * i * dir;
      shifts.push(shifts[i - 1] + shift);
    }
    return shifts.map((shift) => {
      return vops.smul(unit, shift);
    });
  };

  // true if arc should sweep CCW
  // TODO redo so that it automatically looks the smaller angle?
  private arcSweepsCCW = (
    center: Vector,
    start: Vector,
    end: Vector
  ): number => {
    const st = vops.unit(vops.sub(start, center));
    const en = vops.unit(vops.sub(end, center));
    const cross = vops.cross(st, en);
    return cross > 0 ? 0 : 1;
  };
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
  public readonly s1: Segment;
  public readonly s2: Segment;
  private id: string;
  private ticks: Tick | undefined;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(Obj.Angle);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.s1 = new Segment({ p1: props.start, p2: props.center });
    this.s2 = new Segment({ p1: props.center, p2: props.end });
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = [
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ];
    this.id = this.getId(Obj.Angle, this.label);
  }

  equalAngleMark = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.EqualAngleTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    // update style for each tick mark
    if (this.ticks) {
      this.ticks.getLabels().map((id) => {
        console.log(id);
        setStyle(document.getElementById(id));
      });
    }
    [this.s1, this.s2].map((seg) => {
      const ele = document.getElementById(seg.id);
      setStyle(ele);
    });
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Angle}
      />
    );
  };
}

export type TriangleProps = {
  pts: [Point, Point, Point];
  // add things like type of triangle, isos, right, etc.
};
export class Triangle extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle];
  readonly p: [Point, Point, Point];

  constructor(props: TriangleProps, ctx: Content) {
    super(Obj.Triangle);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, ctx);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, ctx);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
  }

  private buildSegments = (
    pts: Point[],
    ctx: Content
  ): [Segment, Segment, Segment] => {
    const sa = ctx.push(new Segment({ p1: pts[0], p2: pts[1] }));
    const sb = ctx.push(new Segment({ p1: pts[0], p2: pts[2] }));
    const sc = ctx.push(new Segment({ p1: pts[1], p2: pts[2] }));
    return [sa, sb, sc];
  };

  private buildAngles = (pts: Point[], ctx: Content): [Angle, Angle, Angle] => {
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
    return [aa, ab, ac];
  };

  svg = (frameIdx: number, style?: React.CSSProperties) => {
    return this.s.flatMap((seg) => seg.svg(frameIdx, style));
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    if (isActive) {
      // for each segment use onClickText
      this.s.map((seg) => {
        seg.onClickText(activeColor)(isActive);
      });
    }
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Angle}
      />
    );
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
