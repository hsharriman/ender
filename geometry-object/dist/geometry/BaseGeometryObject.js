import { getId } from "../utils";
var BaseGeometryObject = /** @class */ (function () {
    function BaseGeometryObject(tag, props) {
        var _this = this;
        this.names = [];
        this.label = "";
        // readonly hoverable: boolean;
        this.getId = getId;
        this.getMode = function (frameKey) { return _this.modes.get(frameKey); };
        this.mode = function (frameKey, mode) {
            _this.modes.set(frameKey, mode);
            return _this;
        };
        // deprecated
        this.onClickText = function (isActive) {
            // do nothing
        };
        this.isEqualTo = function (other) {
            return _this.matches(other.label);
        };
        this.matches = function (name) { return _this.names.find(function (n) { return n === name; }) !== undefined; };
        this.tag = tag;
        this.modes = new Map();
        this.activeIdx = props.activeIdx ? props.activeIdx : -1;
        // this.hoverable = props.hoverable;
    }
    return BaseGeometryObject;
}());
export { BaseGeometryObject };
//# sourceMappingURL=BaseGeometryObject.js.map