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
var Segment = /** @class */ (function (_super) {
    __extends(Segment, _super);
    function Segment(props) {
        var _this = _super.call(this, Obj.Segment, props) || this;
        _this.labeled = function () {
            return {
                p1: _this.p1.pt,
                p2: _this.p2.pt,
                label: _this.label,
            };
        };
        _this.mode = function (frameKey, mode) {
            _this.modes.set(frameKey, mode);
            return _this;
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
        };
        _this.getTick = function (frame) { return _this.ticks.get(frame); };
        _this.p1 = props.p1;
        _this.p2 = props.p2;
        _this.label = "".concat(_this.p1.label).concat(_this.p2.label);
        _this.id = _this.getId(Obj.Segment, _this.label);
        _this.id =
            props.parentFrame !== undefined
                ? "".concat(props.parentFrame, "-").concat(_this.id)
                : _this.id;
        _this.names = permutator([_this.p1.label, _this.p2.label]);
        _this.ticks = new Map();
        return _this;
    }
    return Segment;
}(BaseGeometryObject));
export { Segment };
//# sourceMappingURL=Segment.js.map