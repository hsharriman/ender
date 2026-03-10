import { SegmentProps } from "../types/geometryTypes";
import { LSegment, SVGModes, TickType } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
export declare class Segment extends BaseGeometryObject {
    readonly p1: Point;
    readonly p2: Point;
    readonly id: string;
    ticks: Map<string, {
        type: TickType;
        num: number;
    }>;
    private subSegments;
    private parentSegment;
    constructor(props: SegmentProps);
    labeled: () => LSegment;
    mode: (frameKey: string, mode: SVGModes) => this;
    addTick: (frame: string, type: TickType, num?: number) => this;
    inheritTick: (frame: string, prevFrame: string) => void;
    hideTick: (frame: string) => void;
    getTick: (frame: string) => {
        type: TickType;
        num: number;
    } | undefined;
    equals: (other: Segment) => boolean;
    contains: (pt: Point) => boolean;
    addSubSegment: (s: Segment) => this;
    addParentSegment: (s: Segment) => this;
    getSubSegments: () => Set<Segment>;
    getParentSegments: () => Set<Segment>;
    isSubSegment: (s: Segment) => Set<Segment>;
    isParentSegment: (s: Segment) => boolean;
}
//# sourceMappingURL=Segment.d.ts.map