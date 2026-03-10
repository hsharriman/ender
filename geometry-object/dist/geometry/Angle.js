import { Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
export class Angle extends BaseGeometryObject {
    constructor(props) {
        super(Obj.Angle, props);
        this.parentAngle = null;
        this.labeled = () => {
            return {
                start: this.start.pt,
                center: this.center.pt,
                end: this.end.pt,
                label: this.label,
            };
        };
        this.centerStr = () => {
            return this.center.label;
        };
        // deprecated - DOM manipulation removed for package independence
        this.onClickText = (isActive) => {
            // DOM manipulation removed for package independence
        };
        this.addTick = (frame, type, num = 1) => {
            this.ticks.set(frame, { type, num });
            return this;
        };
        this.inheritTick = (frame, prevFrame) => {
            this.ticks.get(prevFrame) &&
                this.ticks.set(frame, this.ticks.get(prevFrame));
        };
        this.hideTick = (frame) => {
            this.ticks.delete(frame);
            return this;
        };
        this.getTick = (frame) => this.ticks.get(frame);
        this.equals = (other) => {
            return this.names.has(other.label);
        };
        this.contains = (obj) => {
            if (obj.tag === Obj.Point) {
                return Array.from(this.names).some((name) => name.includes(obj.label));
            }
            else {
                const segSet = new Set(obj.label.split(""));
                return ((segSet.has(this.start.label) || segSet.has(this.end.label)) &&
                    segSet.has(this.center.label));
            }
        };
        this.centerEquals = (pt) => {
            return this.center.isEqualTo(pt);
        };
        this.addParentAngle = (a) => {
            this.parentAngle = a;
            return this;
        };
        this.getParentAngle = () => {
            return this.parentAngle;
        };
        this.addNames = (start, end) => {
            this.names.add(`${start}${this.center.label}${end}`);
            this.names.add(`${end}${this.center.label}${start}`);
        };
        this.start = props.start;
        this.center = props.center;
        this.end = props.end;
        this.label = `${props.start.label}${props.center.label}${props.end.label}`;
        this.names = new Set([
            `${this.start.label}${this.center.label}${this.end.label}`,
            `${this.end.label}${this.center.label}${this.start.label}`,
        ]);
        this.id = this.getId(Obj.Angle, this.label);
        this.ticks = new Map();
    }
}
//# sourceMappingURL=Angle.js.map