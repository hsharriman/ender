import { Obj, Quadrilateral, QuadrilateralProps } from "geometry-object";
import { SVGModes } from "../types/diagramTypes";
import { BaseBuilderObject } from "./BaseObject";

export type QuadrilateralBuilderProps = {
  quadrilateral: Quadrilateral;
} & QuadrilateralProps;

export class QuadrilateralBuilder extends BaseBuilderObject {
  readonly quadrilateral: Quadrilateral;
  constructor(props: QuadrilateralBuilderProps) {
    super(Obj.Quadrilateral, props);
    this.quadrilateral = props.quadrilateral;
  }

  override mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.quadrilateral.s.forEach((seg) => seg.mode(frameKey, mode));
    this.quadrilateral.a.forEach((ang) => ang.mode(frameKey, mode));
    return this;
  };
}
