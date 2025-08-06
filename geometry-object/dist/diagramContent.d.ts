import { Angle, AngleProps } from "./geometry/Angle";
import { Point, PointProps } from "./geometry/Point";
import { Quadrilateral, QuadrilateralProps } from "./geometry/Quadrilateral";
import { Segment, SegmentProps } from "./geometry/Segment";
import { Triangle, TriangleProps } from "./geometry/Triangle";
import { Obj } from "./types/types";
export declare enum AspectRatio {
    Square = "square",
    Wide = "wide",
    Tall = "tall",
    Landscape = "landscape"
}
export interface DiagramContent {
    points: Point[];
    segments: Segment[];
    angles: Angle[];
    triangles: Triangle[];
    rectangles: Quadrilateral[];
    frames: string[];
    deps: Map<string, Set<string>>;
    aspect: AspectRatio;
}
export type SupportedObjects = Obj.Point | Obj.Segment | Obj.Angle | Obj.Triangle;
export declare class Content {
    private ctx;
    constructor();
    getId: (objectType: Obj, label: string, tickNumber?: number) => string;
    reliesOn: (id: string, deps: string[]) => void;
    getReliesOn: () => Map<string, Set<string>>;
    addFrame: (name: string) => string;
    setAspect: (aspect: AspectRatio) => void;
    getCtx: () => DiagramContent;
    addPoint: (props: PointProps) => Point;
    addSegment: (props: SegmentProps) => Segment;
    addAngle: (props: AngleProps) => Angle;
    addTriangle: (props: TriangleProps) => Triangle;
    addQuadrilateral: (props: QuadrilateralProps) => Quadrilateral;
    addPoints: (propsArr: PointProps[]) => Point[];
    addSegments: (propsArr: SegmentProps[]) => Segment[];
    addAngles: (propsArr: AngleProps[]) => Angle[];
    addTriangles: (propsArr: TriangleProps[]) => Triangle[];
    addQuadrilaterals: (propsArr: QuadrilateralProps[]) => Quadrilateral[];
    addSegmentFromStr: (str: string) => Segment;
    addTriangleFromStr: (str: string) => Triangle;
    addAngleFromStr: (str: string) => Angle;
    getPoint: (label: string) => Point;
    getSegment: (label: string) => Segment;
    getAngle: (label: string) => Angle;
    getTriangle: (label: string) => Triangle;
    getQuadrilateral: (label: string) => Quadrilateral;
}
//# sourceMappingURL=diagramContent.d.ts.map