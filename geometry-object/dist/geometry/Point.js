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
export var ShowPoint;
(function (ShowPoint) {
    ShowPoint["Always"] = "always";
    ShowPoint["Adaptive"] = "adaptive";
    ShowPoint["Hide"] = "hide";
})(ShowPoint || (ShowPoint = {}));
var Point = /** @class */ (function (_super) {
    __extends(Point, _super);
    function Point(props) {
        var _a;
        var _this = _super.call(this, Obj.Point, props) || this;
        _this.offset = [5, 5];
        _this.labeled = function () {
            return { pt: _this.pt, label: _this.label };
        };
        _this.setOffset = function (offset) {
            _this.offset = offset;
        };
        // deprecated - DOM manipulation removed for package independence
        _this.onClickText = function (isActive) {
            // DOM manipulation removed for package independence
        };
        _this.pt = props.pt;
        _this.label = props.label;
        _this.names = [_this.label];
        _this.offset = props.offset;
        _this.id = _this.getId(Obj.Point, _this.label);
        _this.id = props.parentFrame ? "".concat(props.parentFrame, "-").concat(_this.id) : _this.id;
        _this.showPoint = (_a = props.showPoint) !== null && _a !== void 0 ? _a : ShowPoint.Hide;
        return _this;
    }
    return Point;
}(BaseGeometryObject));
export { Point };
//# sourceMappingURL=Point.js.map