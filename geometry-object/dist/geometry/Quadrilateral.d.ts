import { Content } from "../diagramContent";
import { SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export type QuadrilateralProps = {
    pts: [Point, Point, Point, Point];
} & BaseGeometryProps;
export declare class Quadrilateral extends BaseGeometryObject {
    readonly s: [Segment, Segment, Segment, Segment];
    readonly a: [Angle, Angle, Angle, Angle];
    readonly p: [Point, Point, Point, Point];
    constructor(props: QuadrilateralProps, ctx: Content);
    private buildSegments;
    private buildAngles;
    onClickText: (isActive: boolean) => void;
    mode: (frameKey: string, mode: SVGModes) => this;
}
//# sourceMappingURL=Quadrilateral.d.ts.map