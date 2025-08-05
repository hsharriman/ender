import { Vector } from "./types/types";
export declare const vops: {
    eq: (v1: Vector, v2: Vector) => boolean;
    mag: (v: Vector) => number;
    unit: (v: Vector) => Vector;
    equals: (v1: Vector, v2: Vector) => boolean;
    add: (v1: Vector, v2: Vector) => Vector;
    sub: (v1: Vector, v2: Vector) => Vector;
    smul: (v: Vector, s: number) => Vector;
    div: (v: Vector, s: number) => Vector;
    dot: (v1: Vector, v2: Vector) => number;
    cross: (v1: Vector, v2: Vector) => number;
    rot: ([x, y]: Vector, a: number) => Vector;
    angleBetweenDeg: (v1: Vector, v2: Vector) => number;
};
//# sourceMappingURL=vectorOps.d.ts.map