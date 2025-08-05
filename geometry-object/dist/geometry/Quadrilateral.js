import { Obj } from "../types/types";
import { permutator } from "../utils";
import { BaseGeometryObject } from "./BaseGeometryObject";
export class Quadrilateral extends BaseGeometryObject {
    constructor(props, ctx) {
        super(Obj.Quadrilateral, props);
        this.buildSegments = (pts, ctx, parentFrame) => {
            const sa = ctx.addSegment({
                p1: pts[0],
                p2: pts[1],
                parentFrame,
            });
            const sb = ctx.addSegment({
                p1: pts[1],
                p2: pts[2],
                parentFrame,
            });
            const sc = ctx.addSegment({
                p1: pts[2],
                p2: pts[3],
                parentFrame,
            });
            const sd = ctx.addSegment({
                p1: pts[3],
                p2: pts[0],
                parentFrame,
            });
            return [sa, sb, sc, sd];
        };
        this.buildAngles = (pts, ctx, parentFrame) => {
            const aa = ctx.addAngle({
                start: pts[0],
                center: pts[1],
                end: pts[2],
                parentFrame,
            });
            const ab = ctx.addAngle({
                start: pts[1],
                center: pts[2],
                end: pts[3],
                parentFrame,
            });
            const ac = ctx.addAngle({
                start: pts[3],
                center: pts[0],
                end: pts[1],
                parentFrame,
            });
            const ad = ctx.addAngle({
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
        this.p = props.pts;
        this.s = this.buildSegments(props.pts, ctx, props.parentFrame);
        this.p = props.pts;
        this.a = this.buildAngles(props.pts, ctx, props.parentFrame);
        this.names = permutator(props.pts.map((pt) => pt.label));
    }
}
//# sourceMappingURL=Quadrilateral.js.map