import { LAngle, TickType } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
export type AngleProps = {
    start: Point;
    center: Point;
    end: Point;
} & BaseGeometryProps;
export declare class Angle extends BaseGeometryObject {
    readonly start: Point;
    readonly center: Point;
    readonly end: Point;
    id: string;
    ticks: Map<string, {
        type: TickType;
        num: number;
    }>;
    constructor(props: AngleProps);
    labeled: () => LAngle;
    onClickText: (isActive: boolean) => void;
    addTick: (frame: string, type: TickType, num?: number) => this;
    inheritTick: (frame: string, prevFrame: string) => void;
    hideTick: (frame: string) => this;
    getTick: (frame: string) => {
        type: TickType;
        num: number;
    } | undefined;
}
//# sourceMappingURL=Angle.d.ts.map