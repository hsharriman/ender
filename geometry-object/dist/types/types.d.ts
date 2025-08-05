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
//# sourceMappingURL=types.d.ts.map