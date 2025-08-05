import { Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
export class Angle extends BaseGeometryObject {
    constructor(props) {
        super(Obj.Angle, props);
        this.labeled = () => {
            return {
                start: this.start.pt,
                center: this.center.pt,
                end: this.end.pt,
                label: this.label,
            };
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
        this.start = props.start;
        this.center = props.center;
        this.end = props.end;
        this.label = `${props.start.label}${props.center.label}${props.end.label}`;
        this.names = [
            `${this.start.label}${this.center.label}${this.end.label}`,
            `${this.end.label}${this.center.label}${this.start.label}`,
        ];
        this.id = this.getId(Obj.Angle, this.label);
        this.ticks = new Map();
    }
}
//# sourceMappingURL=Angle.js.map