import { Obj } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Segment } from "./Segment";
export class Triangle extends BaseGeometryObject {
    constructor(props) {
        super(Obj.Triangle, props);
        this.congruent = new Set();
        this.buildSegments = (pts, parentFrame) => {
            const sa = new Segment({
                p1: pts[0],
                p2: pts[1],
                parentFrame,
            });
            const sb = new Segment({
                p1: pts[0],
                p2: pts[2],
                parentFrame,
            });
            const sc = new Segment({
                p1: pts[1],
                p2: pts[2],
                parentFrame,
            });
            return [sa, sb, sc];
        };
        this.buildAngles = (pts, parentFrame) => {
            const aa = new Angle({
                start: pts[0],
                center: pts[1],
                end: pts[2],
                parentFrame,
            });
            const ab = new Angle({
                start: pts[1],
                center: pts[0],
                end: pts[2],
                parentFrame,
            });
            const ac = new Angle({
                start: pts[0],
                center: pts[2],
                end: pts[1],
                parentFrame,
            });
            return [aa, ab, ac];
        };
        // deprecated
        this.onClickText = (isActive) => {
            // for each segment use onClickText
            this.s.forEach((seg) => {
                seg.onClickText(isActive);
            });
            this.a.forEach((ang) => {
                ang.onClickText(isActive);
            });
        };
        this.mode = (frameKey, mode) => {
            // this.modes.set(frameKey, mode);
            // cascading update the segments and angles
            this.s.map((seg) => seg.mode(frameKey, mode));
            this.a.map((ang) => ang.mode(frameKey, mode));
            return this;
        };
        this.labelMode = (frameKey, mode) => {
            this.modes.set(frameKey, mode);
            return this;
        };
        this.setCongruent = (frame) => {
            this.congruent.add(frame);
            return this;
        };
        this.p = props.pts;
        this.s = this.buildSegments(props.pts);
        this.p = props.pts;
        this.a = this.buildAngles(props.pts);
        this.names = this.permutator(props.pts.map((pt) => pt.label));
        this.label = `${props.pts[0].label}${props.pts[1].label}${props.pts[2].label}`;
        this.rotatePattern = props.rotatePattern || false;
        this.id = this.getId(Obj.Triangle, this.label);
    }
}
//# sourceMappingURL=Triangle.js.map