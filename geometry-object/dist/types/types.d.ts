export type Vector = [number, number];
export type LPoint = {
    pt: Vector;
    label: string;
};
export type LSegment = {
    p1: Vector;
    p2: Vector;
    label: string;
};
export type LAngle = {
    center: Vector;
    start: Vector;
    end: Vector;
    label: string;
};
export declare enum Obj {
    Point = "point",
    Segment = "segment",
    Text = "text",
    Angle = "angle",
    ParallelTick = "parallel",
    EqualLengthTick = "equallength",
    Triangle = "triangle",
    EqualAngleTick = "equalangle",
    Tick = "tick",
    HiddenTick = "hiddentick",
    RightTick = "righttick",
    Quadrilateral = "rectangle"
}
export interface ParseObj {
    type: Obj.Point | Obj.Segment | Obj.Angle | Obj.Triangle | Obj.Quadrilateral;
    v: string;
}
export type TickType = Obj.ParallelTick | Obj.EqualLengthTick | Obj.EqualAngleTick | Obj.HiddenTick | Obj.RightTick;
export declare enum SVGModes {
    Hidden = "hidden",
    Unfocused = "unfocused",
    Default = "default",
    ReliesOn = "relieson",
    Derived = "derived",
    Inconsistent = "inconsistent"
}
export declare enum HighlightType {
    Relies = "relies",
    ReliesUnmet = "reliesunmet",
    Highlight = "highlight",
    HighlightUnmet = "highlightunmet"
}
export declare enum AspectRatio {
    Square = "square",
    Wide = "wide",
    Tall = "tall",
    Landscape = "landscape"
}
export declare const vops: {
    add: (v1: Vector, v2: Vector) => Vector;
    sub: (v1: Vector, v2: Vector) => Vector;
    smul: (v: Vector, s: number) => Vector;
    div: (v: Vector, s: number) => Vector;
    mag: (v: Vector) => number;
    dot: (v1: Vector, v2: Vector) => number;
    rot: (v: Vector, deg: number) => Vector;
};
//# sourceMappingURL=types.d.ts.map