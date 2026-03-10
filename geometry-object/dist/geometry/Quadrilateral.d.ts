import { QuadrilateralProps } from "../types/geometryTypes";
import { SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export declare class Quadrilateral extends BaseGeometryObject {
    readonly s: [Segment, Segment, Segment, Segment];
    readonly a: [Angle, Angle, Angle, Angle];
    readonly p: [Point, Point, Point, Point];
    constructor(props: QuadrilateralProps);
    private buildSegments;
    private buildAngles;
    onClickText: (isActive: boolean) => void;
    mode: (frameKey: string, mode: SVGModes) => this;
    contains: (s: Segment | Angle | Point) => boolean;
}
//# sourceMappingURL=Quadrilateral.d.ts.map