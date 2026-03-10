import { Obj } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Segment } from "./Segment";
export class Quadrilateral extends BaseGeometryObject {
    constructor(props) {
        super(Obj.Quadrilateral, props);
        this.buildSegments = (pts, parentFrame) => {
            const sa = new Segment({
                p1: pts[0],
                p2: pts[1],
                parentFrame,
            });
            const sb = new Segment({
                p1: pts[1],
                p2: pts[2],
                parentFrame,
            });
            const sc = new Segment({
                p1: pts[2],
                p2: pts[3],
                parentFrame,
            });
            const sd = new Segment({
                p1: pts[3],
                p2: pts[0],
                parentFrame,
            });
            return [sa, sb, sc, sd];
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
                center: pts[2],
                end: pts[3],
                parentFrame,
            });
            const ac = new Angle({
                start: pts[3],
                center: pts[0],
                end: pts[1],
                parentFrame,
            });
            const ad = new Angle({
                start: pts[2],
                center: pts[3],
                end: pts[0],
                parentFrame,
            });
            return [aa, ab, ac, ad];
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
            this.modes.set(frameKey, mode);
            // cascading update the segments and angles
            this.s.forEach((seg) => seg.mode(frameKey, mode));
            this.a.forEach((ang) => ang.mode(frameKey, mode));
            return this;
        };
        this.contains = (s) => {
            if (s.tag === Obj.Segment) {
                return this.s.some((seg) => seg.equals(s));
            }
            else if (s.tag === Obj.Angle) {
                return this.a.some((ang) => ang.equals(s));
            }
            else if (s.tag === Obj.Point) {
                return this.p.some((pt) => pt.equals(s));
            }
            return false;
        };
        this.p = props.pts;
        this.s = this.buildSegments(props.pts, props.parentFrame);
        this.p = props.pts;
        this.a = this.buildAngles(props.pts, props.parentFrame);
        this.names = this.permutator(props.pts.map((pt) => pt.label));
    }
}
//# sourceMappingURL=Quadrilateral.js.map