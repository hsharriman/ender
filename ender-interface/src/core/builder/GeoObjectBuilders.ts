import {
  Angle,
  Point,
  Quadrilateral,
  Segment,
  Triangle,
  Vector,
} from "geometry-object";
import {
  GeoBuilderObject,
  ShowPoint,
  SVGModes,
  TickedGeoObject,
  TickType,
} from "../types/diagramTypes";

const defaultMode = (
  frameKey: string,
  mode: SVGModes,
  obj: GeoBuilderObject,
) => {
  obj.modes.set(frameKey, mode);
};

const defaultAddTick = (
  frame: string,
  type: TickType,
  obj: TickedGeoObject,
  num: number = 1,
) => {
  obj.ticks.set(frame, { type, num });
};

export const getMode = (frameKey: string, obj: GeoBuilderObject) =>
  obj.modes.get(frameKey);

export interface PointBuilder {
  obj: Point;
  offset: Vector;
  modes: Map<string, SVGModes>;
  showPoint?: ShowPoint;
  mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
}

export interface SegmentBuilder {
  obj: Segment;
  ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  modes: Map<string, SVGModes>;
  mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
  addTick: (
    frame: string,
    type: TickType,
    obj: TickedGeoObject,
    num: number,
  ) => void;
}

export interface AngleBuilder {
  obj: Angle;
  ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  modes: Map<string, SVGModes>;
  addTick: (
    frame: string,
    type: TickType,
    obj: TickedGeoObject,
    num: number,
  ) => void;
  mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
}
export interface TriangleBuilder {
  obj: Triangle;
  modes: Map<string, SVGModes>;
  s: [SegmentBuilder, SegmentBuilder, SegmentBuilder];
  a: [AngleBuilder, AngleBuilder, AngleBuilder];
  mode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => void;
  rotatePattern?: boolean;
  labelMode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => void;
}

export interface QuadrilateralBuilder {
  obj: Quadrilateral;
  modes: Map<string, SVGModes>;
  s: [SegmentBuilder, SegmentBuilder, SegmentBuilder, SegmentBuilder];
  a: [AngleBuilder, AngleBuilder, AngleBuilder, AngleBuilder];
  mode: (frameKey: string, mode: SVGModes, obj: QuadrilateralBuilder) => void;
}

export const pointBuilder = (
  obj: Point,
  offset: Vector = [5, 5],
  showPoint: ShowPoint = ShowPoint.Hide,
): PointBuilder => {
  return {
    obj,
    offset,
    modes: new Map<string, SVGModes>(),
    showPoint,
    mode: defaultMode,
  };
};

export const segmentBuilder = (obj: Segment): SegmentBuilder => {
  return {
    obj,
    ticks: new Map<string, { type: TickType; num: number }>(),
    modes: new Map<string, SVGModes>(),
    mode: defaultMode,
    addTick: defaultAddTick,
  };
};

export const angleBuilder = (obj: Angle): AngleBuilder => {
  return {
    obj,
    ticks: new Map<string, { type: TickType; num: number }>(),
    modes: new Map<string, SVGModes>(),
    addTick: defaultAddTick,
    mode: defaultMode,
  };
};

export const triangleBuilder = (obj: Triangle): TriangleBuilder => {
  return {
    obj,
    modes: new Map<string, SVGModes>(),
    s: [
      segmentBuilder(obj.s[0]),
      segmentBuilder(obj.s[1]),
      segmentBuilder(obj.s[2]),
    ],
    a: [angleBuilder(obj.a[0]), angleBuilder(obj.a[1]), angleBuilder(obj.a[2])],
    mode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => {
      obj.modes.set(frameKey, mode);
      // cascading update the segments and angles
      obj.s.map((seg) => seg.mode(frameKey, mode, seg));
      obj.a.map((ang) => ang.mode(frameKey, mode, ang));
      return this;
    },
    labelMode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => {
      obj.modes.set(frameKey, mode);
    },
  };
};

export const quadrilateralBuilder = (
  obj: Quadrilateral,
): QuadrilateralBuilder => {
  return {
    obj,
    modes: new Map<string, SVGModes>(),
    s: [
      segmentBuilder(obj.s[0]),
      segmentBuilder(obj.s[1]),
      segmentBuilder(obj.s[2]),
      segmentBuilder(obj.s[3]),
    ],
    a: [
      angleBuilder(obj.a[0]),
      angleBuilder(obj.a[1]),
      angleBuilder(obj.a[2]),
      angleBuilder(obj.a[3]),
    ],
    mode: (frameKey: string, mode: SVGModes, quad: QuadrilateralBuilder) => {
      quad.modes.set(frameKey, mode);
      // cascading update the segments and angles
      quad.s.forEach((seg) => seg.mode(frameKey, mode, seg));
      quad.a.forEach((ang) => ang.mode(frameKey, mode, ang));
    },
  };
};
