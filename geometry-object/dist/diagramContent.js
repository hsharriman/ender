// import { AspectRatio } from "./diagramSvg/svgTypes";
import { Angle } from "./geometry/Angle";
import { Point } from "./geometry/Point";
import { Quadrilateral } from "./geometry/Quadrilateral";
import { Segment } from "./geometry/Segment";
import { Triangle } from "./geometry/Triangle";
import { getId } from "./utils";
// Define AspectRatio locally since we removed diagramSvg
export var AspectRatio;
(function (AspectRatio) {
    AspectRatio["Square"] = "square";
    AspectRatio["Wide"] = "wide";
    AspectRatio["Tall"] = "tall";
    AspectRatio["Landscape"] = "landscape";
})(AspectRatio || (AspectRatio = {}));
export class Content {
    constructor() {
        this.getId = getId;
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
            let t = new Triangle(props, this);
            if (!this.getTriangle(t.label))
                this.ctx.triangles.push(t);
            return t;
        };
        this.addQuadrilateral = (props) => {
            const q = new Quadrilateral(props, this);
            if (!this.getQuadrilateral(q.label))
                this.ctx.rectangles.push(q);
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
//# sourceMappingURL=diagramContent.js.map