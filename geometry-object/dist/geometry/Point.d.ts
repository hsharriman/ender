import { PointProps, ShowPoint } from "../types/geometryTypes";
import { LPoint, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Segment } from "./Segment";
export declare class Point extends BaseGeometryObject {
    readonly pt: Vector;
    readonly id: string;
    readonly showPoint: ShowPoint;
    offset: Vector;
    private onLine;
    constructor(props: PointProps);
    labeled: () => LPoint;
    setOffset: (offset: Vector) => void;
    addOnLine: (s: Segment) => void;
    isOnLine: (s: Segment) => boolean;
    equals: (p: Point) => boolean;
    onClickText: (isActive: boolean) => void;
}
//# sourceMappingURL=Point.d.ts.map