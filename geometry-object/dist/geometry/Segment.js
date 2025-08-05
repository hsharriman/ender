import { Obj } from "../types/types";
import { permutator } from "../utils";
import { BaseGeometryObject } from "./BaseGeometryObject";
export class Segment extends BaseGeometryObject {
    constructor(props) {
        super(Obj.Segment, props);
        this.labeled = () => {
            return {
                p1: this.p1.pt,
                p2: this.p2.pt,
                label: this.label,
            };
        };
        this.mode = (frameKey, mode) => {
            this.modes.set(frameKey, mode);
            return this;
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
        };
        this.getTick = (frame) => this.ticks.get(frame);
        this.p1 = props.p1;
        this.p2 = props.p2;
        this.label = `${this.p1.label}${this.p2.label}`;
        this.id = this.getId(Obj.Segment, this.label);
        this.id =
            props.parentFrame !== undefined
                ? `${props.parentFrame}-${this.id}`
                : this.id;
        this.names = permutator([this.p1.label, this.p2.label]);
        this.ticks = new Map();
    }
}
//# sourceMappingURL=Segment.js.map