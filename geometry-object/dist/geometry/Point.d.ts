import { LPoint, Vector } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
export declare enum ShowPoint {
    Always = "always",
    Adaptive = "adaptive",
    Hide = "hide"
}
export type PointProps = {
    pt: Vector;
    label: string;
    offset: Vector;
    showPoint?: ShowPoint;
} & BaseGeometryProps;
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