import { AngleProps } from "../types/geometryTypes";
import { LAngle, TickType } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export declare class Angle extends BaseGeometryObject {
    readonly start: Point;
    readonly center: Point;
    readonly end: Point;
    id: string;
    ticks: Map<string, {
        type: TickType;
        num: number;
    }>;
    private parentAngle;
    constructor(props: AngleProps);
    labeled: () => LAngle;
    centerStr: () => string;
    onClickText: (isActive: boolean) => void;
    addTick: (frame: string, type: TickType, num?: number) => this;
    inheritTick: (frame: string, prevFrame: string) => void;
    hideTick: (frame: string) => this;
    getTick: (frame: string) => {
        type: TickType;
        num: number;
    } | undefined;
    equals: (other: Angle) => boolean;
    contains: (obj: Point | Segment) => boolean;
    centerEquals: (pt: Point) => boolean;
    addParentAngle: (a: Angle) => this;
    getParentAngle: () => Angle | null;
    addNames: (start: string, end: string) => void;
}
//# sourceMappingURL=Angle.d.ts.map