import { Obj, Triangle, TriangleProps } from "geometry-object";
import { SVGModes } from "../types/diagramTypes";
import { BaseBuilderObject } from "./BaseObject";

export type TriangleBuilderProps = {
  triangle: Triangle;
  rotatePattern?: boolean;
} & TriangleProps;

export class TriangleBuilder extends BaseBuilderObject {
  readonly rotatePattern: boolean;
  readonly triangle: Triangle;
  constructor(props: TriangleBuilderProps) {
    super(Obj.Triangle, props);
    this.rotatePattern = props.rotatePattern || false;
    this.triangle = props.triangle;
  }

  override mode = (frameKey: string, mode: SVGModes) => {
    // this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.triangle.s.map((seg) => seg.mode(frameKey, mode));
    this.triangle.a.map((ang) => ang.mode(frameKey, mode));
    return this;
  };

  labelMode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };
}
