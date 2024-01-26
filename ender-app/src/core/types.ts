export type Vector = [number, number];
export type LPoint = { pt: Vector; label: string };
export type LSegment = { p1: Vector; p2: Vector; label: string };
export type LAngle = {
  center: Vector;
  start: Vector;
  end: Vector;
  label: string;
};

export enum Obj {
  Point = "point",
  Segment = "segment",
  Text = "text",
  // Circle,
  Angle = "angle",
  ParallelTick = "parallel",
  EqualLengthTick = "equallength",
  Triangle = "triangle",
}

export enum SVGFlag {
  False = 0,
  True = 1,
}

export type BaseSVGProps = {
  key: string;
  names?: string[];
  style?: React.CSSProperties;
};

export type CircleSVGProps = {
  center: Vector;
  r: number;
} & BaseSVGProps;

export type LineSVGProps = {
  start: Vector;
  end: Vector;
  key: string;
  style?: React.CSSProperties;
} & BaseSVGProps;

export type TextSVGProps = {
  point: Vector;
  key: string;
  text: string;
} & BaseSVGProps;

export type PolylineSVGProps = {
  points: Vector[];
  fill: string;
} & BaseSVGProps;

export type CircularArcSVGProps = {
  end: Vector;
  start: Vector;
  r: number;
  majorArc: SVGFlag;
  sweep: SVGFlag;
} & BaseSVGProps;

export type QuadBezierSVGProps = {
  start: Vector;
  anchor: Vector;
  end: Vector;
} & BaseSVGProps;

export type GHash<T> = {
  labels: string[];
  map: { [label: string]: T };
};
