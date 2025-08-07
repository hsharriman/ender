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
import { BaseGeometryObject } from "./BaseGeometryObject";
var Angle = /** @class */ (function (_super) {
    __extends(Angle, _super);
    function Angle(props) {
        var _this = _super.call(this, Obj.Angle, props) || this;
        _this.labeled = function () {
            return {
                start: _this.start.pt,
                center: _this.center.pt,
                end: _this.end.pt,
                label: _this.label,
            };
        };
        // deprecated - DOM manipulation removed for package independence
        _this.onClickText = function (isActive) {
            // DOM manipulation removed for package independence
        };
        _this.addTick = function (frame, type, num) {
            if (num === void 0) { num = 1; }
            _this.ticks.set(frame, { type: type, num: num });
            return _this;
        };
        _this.inheritTick = function (frame, prevFrame) {
            _this.ticks.get(prevFrame) &&
                _this.ticks.set(frame, _this.ticks.get(prevFrame));
        };
        _this.hideTick = function (frame) {
            _this.ticks.delete(frame);
            return _this;
        };
        _this.getTick = function (frame) { return _this.ticks.get(frame); };
        _this.start = props.start;
        _this.center = props.center;
        _this.end = props.end;
        _this.label = "".concat(props.start.label).concat(props.center.label).concat(props.end.label);
        _this.names = [
            "".concat(_this.start.label).concat(_this.center.label).concat(_this.end.label),
            "".concat(_this.end.label).concat(_this.center.label).concat(_this.start.label),
        ];
        _this.id = _this.getId(Obj.Angle, _this.label);
        _this.ticks = new Map();
        return _this;
    }
    return Angle;
}(BaseGeometryObject));
export { Angle };
//# sourceMappingURL=Angle.js.map