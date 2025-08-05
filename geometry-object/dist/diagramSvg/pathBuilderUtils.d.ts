import { Vector } from "../types/types";
export declare const pops: {
    moveTo: (v: Vector) => string;
    lineTo: (v: Vector) => string;
    curveTo: (v1: Vector, v2: Vector, v3: Vector) => string;
    closePath: () => string;
    arcTo: (r: number, major: number, sweep: number, end: Vector) => string;
};
//# sourceMappingURL=pathBuilderUtils.d.ts.map