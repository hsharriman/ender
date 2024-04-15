import { SVGModes, Vector } from "../types";

export enum SVGObj {
  Circle,
  Line,
  Curve,
  Polyline,
  Text,
}

export type BaseSVGProps = {
  geoId: string;
  // modes?: Map<string, SVGModes>;
  mode: SVGModes;
  activeFrame: string;
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
  style?: React.CSSProperties;
} & BaseSVGProps;

export type TextSVGProps = {
  point: Vector;
  text: string;
} & BaseSVGProps;

export type PolylineSVGProps = {
  points: Vector[];
} & BaseSVGProps;

export type CircularArcSVGProps = {
  end: Vector;
  start: Vector;
  r: number;
  majorArc: number;
  sweep: number;
} & BaseSVGProps;

export type QuadBezierSVGProps = {
  start: Vector;
  anchor: Vector;
  end: Vector;
} & BaseSVGProps;

export type PathSVGProps = {
  d: string;
} & BaseSVGProps;
