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
var Quadrilateral = /** @class */ (function (_super) {
    __extends(Quadrilateral, _super);
    function Quadrilateral(props, ctx) {
        var _this = _super.call(this, Obj.Quadrilateral, props) || this;
        _this.buildSegments = function (pts, ctx, parentFrame) {
            var sa = ctx.addSegment({
                p1: pts[0],
                p2: pts[1],
                parentFrame: parentFrame,
            });
            var sb = ctx.addSegment({
                p1: pts[1],
                p2: pts[2],
                parentFrame: parentFrame,
            });
            var sc = ctx.addSegment({
                p1: pts[2],
                p2: pts[3],
                parentFrame: parentFrame,
            });
            var sd = ctx.addSegment({
                p1: pts[3],
                p2: pts[0],
                parentFrame: parentFrame,
            });
            return [sa, sb, sc, sd];
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
                center: pts[2],
                end: pts[3],
                parentFrame: parentFrame,
            });
            var ac = ctx.addAngle({
                start: pts[3],
                center: pts[0],
                end: pts[1],
                parentFrame: parentFrame,
            });
            var ad = ctx.addAngle({
                start: pts[2],
                center: pts[3],
                end: pts[0],
                parentFrame: parentFrame,
            });
            return [aa, ab, ac, ad];
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
            _this.modes.set(frameKey, mode);
            // cascading update the segments and angles
            _this.s.forEach(function (seg) { return seg.mode(frameKey, mode); });
            _this.a.forEach(function (ang) { return ang.mode(frameKey, mode); });
            return _this;
        };
        _this.p = props.pts;
        _this.s = _this.buildSegments(props.pts, ctx, props.parentFrame);
        _this.p = props.pts;
        _this.a = _this.buildAngles(props.pts, ctx, props.parentFrame);
        _this.names = permutator(props.pts.map(function (pt) { return pt.label; }));
        return _this;
    }
    return Quadrilateral;
}(BaseGeometryObject));
export { Quadrilateral };
//# sourceMappingURL=Quadrilateral.js.map