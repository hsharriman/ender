import { AspectRatio } from "../types/types";
import { getId } from "../utils";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";
var DiagramContent = /** @class */ (function () {
    function DiagramContent() {
        var _this = this;
        this.getId = getId;
        this.reliesOn = function (id, deps) {
            // adds dependencies from one step to another
            // key is mode, value is array of modes that it depends on
            _this.ctx.deps.set(id, new Set(deps));
        };
        this.getReliesOn = function () {
            return _this.ctx.deps;
        };
        this.addFrame = function (name) {
            _this.ctx.frames.push(name);
            return name;
        };
        this.setAspect = function (aspect) {
            _this.ctx.aspect = aspect;
        };
        this.getCtx = function () { return _this.ctx; };
        this.addPoint = function (props) {
            var pt = new Point(props);
            if (!_this.getPoint(pt.label))
                _this.ctx.points.push(pt);
            return pt;
        };
        this.addSegment = function (props) {
            var s = new Segment(props);
            if (!_this.getSegment(s.label))
                _this.ctx.segments.push(s);
            return s;
        };
        this.addAngle = function (props) {
            var a = new Angle(props);
            if (!_this.getAngle(a.label))
                _this.ctx.angles.push(a);
            return a;
        };
        this.addTriangle = function (props) {
            var t = new Triangle(props, _this);
            if (!_this.getTriangle(t.label))
                _this.ctx.triangles.push(t);
            return t;
        };
        this.addQuadrilateral = function (props) {
            var q = new Quadrilateral(props, _this);
            if (!_this.getQuadrilateral(q.label))
                _this.ctx.rectangles.push(q);
            return q;
        };
        this.addPoints = function (propsArr) {
            return propsArr.map(function (props) { return _this.addPoint(props); });
        };
        this.addSegments = function (propsArr) {
            return propsArr.map(function (props) { return _this.addSegment(props); });
        };
        this.addAngles = function (propsArr) {
            return propsArr.map(function (props) { return _this.addAngle(props); });
        };
        this.addTriangles = function (propsArr) {
            return propsArr.map(function (props) { return _this.addTriangle(props); });
        };
        this.addQuadrilaterals = function (propsArr) {
            return propsArr.map(function (props) { return _this.addQuadrilateral(props); });
        };
        this.addSegmentFromStr = function (str) {
            var _a = str.split("").map(function (c) { return _this.getPoint(c); }), a = _a[0], b = _a[1];
            return _this.addSegment({ p1: a, p2: b });
        };
        this.addTriangleFromStr = function (str) {
            var _a = str.split("").map(function (c) { return _this.getPoint(c); }), a = _a[0], b = _a[1], c = _a[2];
            return _this.addTriangle({ pts: [a, b, c] });
        };
        this.addAngleFromStr = function (str) {
            var _a = str.split("").map(function (c) { return _this.getPoint(c); }), a = _a[0], b = _a[1], c = _a[2];
            return _this.addAngle({ start: a, center: b, end: c });
        };
        this.getPoint = function (label) {
            return _this.ctx.points.filter(function (p) { return p.matches(label); })[0];
        };
        this.getSegment = function (label) {
            return _this.ctx.segments.filter(function (s) { return s.matches(label); })[0];
        };
        this.getAngle = function (label) {
            return _this.ctx.angles.filter(function (a) { return a.matches(label); })[0];
        };
        this.getTriangle = function (label) {
            return _this.ctx.triangles.filter(function (t) { return t.matches(label); })[0];
        };
        this.getQuadrilateral = function (label) {
            return _this.ctx.rectangles.filter(function (r) { return r.matches(label); })[0];
        };
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
    return DiagramContent;
}());
export default DiagramContent;
//# sourceMappingURL=DiagramContent.js.map