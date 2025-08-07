import {
  PointProps,
  ShowPoint,
} from "geometry-object/dist/types/geometryTypes";
import { LPoint, Vector } from "geometry-object/dist/types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
export declare class Point extends BaseGeometryObject {
  readonly pt: Vector;
  readonly id: string;
  readonly showPoint: ShowPoint;
  offset: Vector;
  constructor(props: PointProps);
  labeled: () => LPoint;
  setOffset: (offset: Vector) => void;
  onClickText: (isActive: boolean) => void;
}
//# sourceMappingURL=Point.d.ts.map
