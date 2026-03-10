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
        this.orderTriangle = (p, ctx) => {
            this.p = [ctx.getPoint(p[0]), ctx.getPoint(p[1]), ctx.getPoint(p[2])];
            this.s = this.buildSegments(this.p);
            this.a = this.buildAngles(this.p);
            this.sorted = true;
            return this;
        };
        this.getThirdPoint = (p1, p2) => {
            const remaining = this.label.replace(p1, "").replace(p2, "");
            // TODO import error
            // if (remaining.length !== 1) {
            //   logError.geometric.incorrectGetThirdPointArgs(this.label, p1, p2);
            // }
            return remaining;
        };
        this.isSorted = () => this.sorted;
        this.getSegmentIndex = (name) => {
            return this.s.findIndex((seg) => new Set(seg.names).has(name));
        };
        this.getAngleIndex = (name) => {
            return this.a.findIndex((ang) => new Set(ang.names).has(name));
        };
        this.getAngleByCenter = (center) => {
            return this.a.find((ang) => ang.center.label.toLowerCase() === center.toLowerCase());
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
        this.containsParseObj = (obj) => {
            if (obj.type === Obj.Segment) {
                return this.s.some((seg) => seg.names.has(obj.v));
            }
            else if (obj.type === Obj.Angle) {
                return this.a.some((ang) => ang.names.has(obj.v));
            }
            return false;
        };
        this.contains = (obj) => {
            if (obj.tag === Obj.Segment) {
                return this.s.some((seg) => seg.equals(obj));
            }
            else {
                return this.a.some((ang) => ang.equals(obj));
            }
        };
        this.p = props.pts;
        this.s = this.buildSegments(props.pts);
        this.p = props.pts;
        this.a = this.buildAngles(props.pts);
        this.names = this.permutator(props.pts.map((pt) => pt.label));
        this.label = `${props.pts[0].label}${props.pts[1].label}${props.pts[2].label}`;
        this.rotatePattern = props.rotatePattern || false;
        this.id = this.getId(Obj.Triangle, this.label);
        this.sorted = false;
    }
}
//# sourceMappingURL=Triangle.js.map