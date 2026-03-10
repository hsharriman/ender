import { TriangleProps } from "../types/geometryTypes";
import { ParseObj, SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { DiagramContent } from "./DiagramContent";
import { Point } from "./Point";
import { Segment } from "./Segment";
export declare class Triangle extends BaseGeometryObject {
    s: [Segment, Segment, Segment];
    a: [Angle, Angle, Angle];
    private sorted;
    p: [Point, Point, Point];
    readonly id: string;
    readonly rotatePattern: boolean;
    readonly congruent: Set<string>;
    constructor(props: TriangleProps);
    private buildSegments;
    private buildAngles;
    orderTriangle: (p: [string, string, string], ctx: DiagramContent) => this;
    getThirdPoint: (p1: string, p2: string) => string;
    isSorted: () => boolean;
    getSegmentIndex: (name: string) => number;
    getAngleIndex: (name: string) => number;
    getAngleByCenter: (center: string) => Angle | undefined;
    onClickText: (isActive: boolean) => void;
    mode: (frameKey: string, mode: SVGModes) => this;
    labelMode: (frameKey: string, mode: SVGModes) => this;
    setCongruent: (frame: string) => this;
    containsParseObj: (obj: ParseObj) => boolean;
    contains: (obj: Segment | Angle) => boolean;
}
//# sourceMappingURL=Triangle.d.ts.map