import { AspectRatio } from "../types/types";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";
export class DiagramContent {
    constructor() {
        this.reliesOn = (id, deps) => {
            // adds dependencies from one step to another
            // key is mode, value is array of modes that it depends on
            this.ctx.deps.set(id, new Set(deps));
        };
        this.getReliesOn = () => {
            return this.ctx.deps;
        };
        this.addFrame = (name) => {
            this.ctx.frames.push(name);
            return name;
        };
        this.setAspect = (aspect) => {
            this.ctx.aspect = aspect;
        };
        this.getCtx = () => this.ctx;
        this.addPoint = (props) => {
            const pt = new Point(props);
            if (!this.getPoint(pt.label))
                this.ctx.points.push(pt);
            return pt;
        };
        this.addSegment = (props) => {
            let s = new Segment(props);
            if (!this.getSegment(s.label))
                this.ctx.segments.push(s);
            return s;
        };
        this.addAngle = (props) => {
            let a = new Angle(props);
            if (!this.getAngle(a.label))
                this.ctx.angles.push(a);
            return a;
        };
        this.addTriangle = (props) => {
            let t = new Triangle(props);
            if (!this.getTriangle(t.label)) {
                this.ctx.triangles.push(t);
                this.addSegments(t.s);
                this.addAngles(t.a);
            }
            return t;
        };
        this.addQuadrilateral = (props) => {
            const q = new Quadrilateral(props);
            if (!this.getQuadrilateral(q.label)) {
                this.ctx.rectangles.push(q);
                this.addSegments(q.s);
                this.addAngles(q.a);
            }
            return q;
        };
        this.addPoints = (propsArr) => {
            return propsArr.map((props) => this.addPoint(props));
        };
        this.addSegments = (propsArr) => {
            return propsArr.map((props) => this.addSegment(props));
        };
        this.addAngles = (propsArr) => {
            return propsArr.map((props) => this.addAngle(props));
        };
        this.addTriangles = (propsArr) => {
            return propsArr.map((props) => this.addTriangle(props));
        };
        this.addQuadrilaterals = (propsArr) => {
            return propsArr.map((props) => this.addQuadrilateral(props));
        };
        this.addSegmentFromStr = (str) => {
            const [a, b] = str.split("").map((c) => this.getPoint(c));
            return this.addSegment({ p1: a, p2: b });
        };
        this.addTriangleFromStr = (str) => {
            const [a, b, c] = str.split("").map((c) => this.getPoint(c));
            return this.addTriangle({ pts: [a, b, c] });
        };
        this.addAngleFromStr = (str) => {
            const [a, b, c] = str.split("").map((c) => this.getPoint(c));
            return this.addAngle({ start: a, center: b, end: c });
        };
        this.getPoint = (label) => this.ctx.points.filter((p) => p.matches(label))[0];
        this.getSegment = (label) => this.ctx.segments.filter((s) => s.matches(label))[0];
        this.getAngle = (label) => this.ctx.angles.filter((a) => a.matches(label))[0];
        this.getTriangle = (label) => this.ctx.triangles.filter((t) => t.matches(label))[0];
        this.getQuadrilateral = (label) => this.ctx.rectangles.filter((r) => r.matches(label))[0];
        this.ctx = {
            points: [],
            segments: [],
            angles: [],
            triangles: [],
            rectangles: [],
            frames: [],
            deps: new Map(),
            aspect: AspectRatio.Square,
        };
    }
}
//# sourceMappingURL=DiagramContent.js.map