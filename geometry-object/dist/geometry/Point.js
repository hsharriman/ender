import { ShowPoint } from "../types/geometryTypes";
import { Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
export class Point extends BaseGeometryObject {
    constructor(props) {
        var _a;
        super(Obj.Point, props);
        this.offset = [5, 5];
        this.labeled = () => {
            return { pt: this.pt, label: this.label };
        };
        this.setOffset = (offset) => {
            this.offset = offset;
        };
        // deprecated - DOM manipulation removed for package independence
        this.onClickText = (isActive) => {
            // DOM manipulation removed for package independence
        };
        this.pt = props.pt;
        this.label = props.label;
        this.names = [this.label];
        this.offset = props.offset;
        this.id = this.getId(Obj.Point, this.label);
        this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
        this.showPoint = (_a = props.showPoint) !== null && _a !== void 0 ? _a : ShowPoint.Hide;
    }
}
//# sourceMappingURL=Point.js.map