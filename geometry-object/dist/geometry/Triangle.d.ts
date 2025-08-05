import { Content } from "../diagramContent";
import { SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export type TriangleProps = {
    pts: [Point, Point, Point];
    rotatePattern?: boolean;
} & BaseGeometryProps;
export declare class Triangle extends BaseGeometryObject {
    readonly s: [Segment, Segment, Segment];
    readonly a: [Angle, Angle, Angle];
    readonly p: [Point, Point, Point];
    readonly id: string;
    readonly rotatePattern: boolean;
    readonly congruent: Set<string>;
    constructor(props: TriangleProps, ctx: Content);
    private buildSegments;
    private buildAngles;
    onClickText: (isActive: boolean) => void;
    mode: (frameKey: string, mode: SVGModes) => this;
    labelMode: (frameKey: string, mode: SVGModes) => this;
    setCongruent: (frame: string) => this;
}
//# sourceMappingURL=Triangle.d.ts.map