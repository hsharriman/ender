import { DiagramCtx } from "../types/geometryTypes";
import { AspectRatio } from "../types/types";
import { Angle, AngleProps } from "./Angle";
import { Point, PointProps } from "./Point";
import { Quadrilateral, QuadrilateralProps } from "./Quadrilateral";
import { Segment, SegmentProps } from "./Segment";
import { Triangle, TriangleProps } from "./Triangle";
export default class DiagramContent {
    private ctx;
    constructor();
    getId: (objectType: import("../types/types").Obj, label: string, tickNumber?: number) => string;
    reliesOn: (id: string, deps: string[]) => void;
    getReliesOn: () => Map<string, Set<string>>;
    addFrame: (name: string) => string;
    setAspect: (aspect: AspectRatio) => void;
    getCtx: () => DiagramCtx;
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
//# sourceMappingURL=DiagramContent.d.ts.map