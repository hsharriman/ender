var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Obj } from "../types/types";
import { permutator } from "../utils";
import { BaseGeometryObject } from "./BaseGeometryObject";
var Triangle = /** @class */ (function (_super) {
    __extends(Triangle, _super);
    function Triangle(props, ctx) {
        var _this = _super.call(this, Obj.Triangle, props) || this;
        _this.congruent = new Set();
        _this.buildSegments = function (pts, ctx, parentFrame) {
            var sa = ctx.addSegment({
                p1: pts[0],
                p2: pts[1],
                parentFrame: parentFrame,
            });
            var sb = ctx.addSegment({
                p1: pts[0],
                p2: pts[2],
                parentFrame: parentFrame,
            });
            var sc = ctx.addSegment({
                p1: pts[1],
                p2: pts[2],
                parentFrame: parentFrame,
            });
            return [sa, sb, sc];
        };
        _this.buildAngles = function (pts, ctx, parentFrame) {
            var aa = ctx.addAngle({
                start: pts[0],
                center: pts[1],
                end: pts[2],
                parentFrame: parentFrame,
            });
            var ab = ctx.addAngle({
                start: pts[1],
                center: pts[0],
                end: pts[2],
                parentFrame: parentFrame,
            });
            var ac = ctx.addAngle({
                start: pts[0],
                center: pts[2],
                end: pts[1],
                parentFrame: parentFrame,
            });
            return [aa, ab, ac];
        };
        // deprecated
        _this.onClickText = function (isActive) {
            // for each segment use onClickText
            _this.s.forEach(function (seg) {
                seg.onClickText(isActive);
            });
            _this.a.forEach(function (ang) {
                ang.onClickText(isActive);
            });
        };
        _this.mode = function (frameKey, mode) {
            // this.modes.set(frameKey, mode);
            // cascading update the segments and angles
            _this.s.map(function (seg) { return seg.mode(frameKey, mode); });
            _this.a.map(function (ang) { return ang.mode(frameKey, mode); });
            return _this;
        };
        _this.labelMode = function (frameKey, mode) {
            _this.modes.set(frameKey, mode);
            return _this;
        };
        _this.setCongruent = function (frame) {
            _this.congruent.add(frame);
            return _this;
        };
        _this.p = props.pts;
        _this.s = _this.buildSegments(props.pts, ctx);
        _this.p = props.pts;
        _this.a = _this.buildAngles(props.pts, ctx);
        _this.names = permutator(props.pts.map(function (pt) { return pt.label; }));
        _this.label = "".concat(props.pts[0].label).concat(props.pts[1].label).concat(props.pts[2].label);
        _this.rotatePattern = props.rotatePattern || false;
        _this.id = _this.getId(Obj.Triangle, _this.label);
        return _this;
    }
    return Triangle;
}(BaseGeometryObject));
export { Triangle };
//# sourceMappingURL=Triangle.js.map