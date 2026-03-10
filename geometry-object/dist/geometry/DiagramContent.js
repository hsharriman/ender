import { AspectRatio } from "../types/types";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";
export class DiagramContent {
    constructor(prevCtx) {
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
            var _a;
            let s = new Segment(props);
            if (!this.getSegment(s.label))
                this.ctx.segments.push(s);
            return (_a = this.getSegment(s.label)) !== null && _a !== void 0 ? _a : s;
        };
        this.addAngle = (props) => {
            var _a;
            let a = new Angle(props);
            return (_a = this.getAngle(a.label)) !== null && _a !== void 0 ? _a : this.overlap(a);
        };
        this.addTriangle = (props) => {
            var _a;
            let t = new Triangle(props);
            if (!this.getTriangle(t.label)) {
                this.ctx.triangles.push(t);
                this.addSegments(t.s);
                this.addAngles(t.a);
            }
            return (_a = this.getTriangle(t.label)) !== null && _a !== void 0 ? _a : t;
        };
        this.addQuadrilateral = (props) => {
            var _a;
            const q = new Quadrilateral(props);
            if (!this.getQuadrilateral(q.label)) {
                this.ctx.rectangles.push(q);
                this.addSegments(q.s);
                this.addAngles(q.a);
            }
            return (_a = this.getQuadrilateral(q.label)) !== null && _a !== void 0 ? _a : q;
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
            if (str.startsWith("t_")) {
                str = str.slice(2);
            }
            const [a, b, c] = str.split("").map((c) => this.getPoint(c));
            return this.addTriangle({ pts: [a, b, c] });
        };
        this.addQuadrilateralFromStr = (str) => {
            if (str.startsWith("q_")) {
                str = str.slice(2);
            }
            const [a, b, c, d] = str.split("").map((c) => this.getPoint(c));
            return this.addQuadrilateral({ pts: [a, b, c, d] });
        };
        this.addAngleFromStr = (str) => {
            if (str.startsWith("a_")) {
                str = str.slice(2);
            }
            const [a, b, c] = str.split("").map((c) => this.getPoint(c));
            return this.addAngle({ start: a, center: b, end: c });
        };
        this.getPoint = (label) => this.ctx.points.filter((p) => p.matches(label))[0];
        this.getSegment = (label) => this.ctx.segments.filter((s) => s.matches(label))[0];
        this.getAngle = (label) => this.ctx.angles.filter((a) => a.matches(label))[0];
        this.getTriangle = (label) => this.ctx.triangles.filter((t) => t.matches(label))[0];
        this.getQuadrilateral = (label) => this.ctx.rectangles.filter((r) => r.matches(label))[0];
        this.checkAngleOverlaps = () => {
            this.ctx.angles.forEach((a) => this.overlap(a));
        };
        this.overlap = (a) => {
            const [s, c, e] = [a.start.label, a.center.label, a.end.label];
            let overlapsExisting = false;
            const findOverlaps = (segSet, angleEnd) => {
                if (segSet.size > 0) {
                    segSet.forEach((s) => {
                        // add an overlapping angle if the center of the angle is one of the segment endpoints
                        if (s.label.includes(c)) {
                            const overlapLabel = `${angleEnd}${c}${s.label.replace(c, "")}`;
                            // does overlapping angle already exist in ctx?
                            const existingAngle = this.getAngle(overlapLabel);
                            if (existingAngle) {
                                // add new angle to existing angle's list of names instead of creating new angle
                                overlapsExisting = true;
                                existingAngle.addNames(angleEnd, s.label.replace(c, ""));
                            }
                            else {
                                // overlapping angle isn't tracked, add it to original angle
                                a.addNames(angleEnd, s.label.replace(c, ""));
                            }
                        }
                    });
                }
            };
            // get segments that form the angle
            const startToCenter = this.getSegment(`${s}${c}`);
            const endToCenter = this.getSegment(`${c}${e}`);
            // check for overlaps with parent segments
            findOverlaps(startToCenter.getParentSegments(), e); // 3rd pt = end
            findOverlaps(endToCenter.getParentSegments(), s); // 3rd pt = start
            // check for overlaps with sub segments
            findOverlaps(startToCenter.getSubSegments(), e); // 3rd pt = end
            findOverlaps(endToCenter.getSubSegments(), s); // 3rd pt = start
            // if doesn't overlap with existing angles, add the angle to the ctx
            if (!overlapsExisting) {
                this.ctx.angles.push(a);
            }
            return a;
        };
        this.print = () => {
            console.log("pts", this.ctx.points.map((p) => p.label));
            console.log("segs", this.ctx.segments.map((s) => s.label));
            console.log("angs", this.ctx.angles.map((a) => a.label));
            console.log("tris", this.ctx.triangles.map((t) => t.label));
            console.log("quads", this.ctx.rectangles.map((q) => q.label));
        };
        this.ctx = prevCtx !== null && prevCtx !== void 0 ? prevCtx : {
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