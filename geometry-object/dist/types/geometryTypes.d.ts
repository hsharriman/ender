import { Angle } from "../geometry/Angle";
import { Point } from "../geometry/Point";
import { Quadrilateral } from "../geometry/Quadrilateral";
import { Segment } from "../geometry/Segment";
import { Triangle } from "../geometry/Triangle";
import { AspectRatio, Obj } from "./types";
export type SupportedObjects = Obj.Point | Obj.Segment | Obj.Angle | Obj.Triangle;
export interface DiagramCtx {
    points: Point[];
    segments: Segment[];
    angles: Angle[];
    triangles: Triangle[];
    rectangles: Quadrilateral[];
    frames: string[];
    deps: Map<string, Set<string>>;
    aspect: AspectRatio;
}
//# sourceMappingURL=geometryTypes.d.ts.map