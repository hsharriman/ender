import { WaysToProveCandidate } from "checker/types/checkerTypes";
import { Obj } from "geometry-object";
import React from "react";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { DiagramRenderCtx, SVGModes } from "../../core/types/diagramTypes";
import { Diagram } from "./Diagram";

interface ReasonMiniVisualProps {
  candidate: WaysToProveCandidate;
  miniCtx?: DiagramRenderCtx;
  diagramAspect: AspectRatio;
}

const uniq = (items: string[]): string[] => Array.from(new Set(items));

export class ReasonMiniVisual extends React.Component<ReasonMiniVisualProps> {
  private frameId = () => "mini";

  private fulfilledRefs = (): string[] => {
    return uniq(
      this.props.candidate.slots
        .filter((slot) => slot.state === "matched")
        .flatMap((slot) => [
          ...(slot.visualRefs ?? []),
          ...(slot.visualRef ? [slot.visualRef] : []),
        ]),
    );
  };

  private applyTickMarks = (ctx: DiagramRenderCtx, frame: string) => {
    if (!ctx) return;
    let pairIdx = 1;
    this.props.candidate.contributors.forEach((contributor) => {
      const segMatch = contributor.match(/^con_seg\(([^,]+),\s*([^)]+)\)$/);
      if (segMatch) {
        const segA = segMatch[1].trim();
        const segB = segMatch[2].trim();
        ctx.segments.forEach((seg) => {
          if (seg.obj.matches(segA) || seg.obj.matches(segB)) {
            seg.addTick(frame, Obj.EqualLengthTick, pairIdx);
          }
        });
        pairIdx += 1;
      }
      const angMatch = contributor.match(/^con_ang\(([^,]+),\s*([^)]+)\)$/);
      if (angMatch) {
        const angA = angMatch[1].trim();
        const angB = angMatch[2].trim();
        ctx.angles.forEach((ang) => {
          if (ang.obj.matches(angA) || ang.obj.matches(angB)) {
            ang.addTick(frame, Obj.EqualAngleTick, 1);
          }
        });
      }
    });
  };

  private highlightCtx = (frame: string): DiagramRenderCtx | undefined => {
    const ctx = this.props.miniCtx;
    if (!ctx) return undefined;
    const fulfilled = new Set(this.fulfilledRefs());
    const highlight: DiagramRenderCtx = {
      points: ctx.points.filter((pt) => fulfilled.has(pt.obj.label)),
      segments: ctx.segments.filter((seg) => fulfilled.has(seg.obj.label)),
      angles: ctx.angles.filter((ang) => fulfilled.has(ang.obj.label)),
      triangles: ctx.triangles.filter((tri) => fulfilled.has(tri.obj.label)),
      rectangles: [],
      frames: [frame],
      deps: new Map<string, Set<string>>(),
    };
    highlight.points.forEach((pt) => pt.mode(frame, SVGModes.Derived));
    highlight.segments.forEach((seg) => seg.mode(frame, SVGModes.Derived));
    highlight.angles.forEach((ang) => ang.mode(frame, SVGModes.Derived));
    highlight.triangles.forEach((tri) => tri.mode(frame, SVGModes.Derived));
    this.applyTickMarks(highlight, frame);
    return highlight;
  };

  render() {
    if (!this.props.miniCtx) return <></>;
    const frame = this.frameId();
    this.applyTickMarks(this.props.miniCtx, frame);
    const highlightCtx = this.highlightCtx(frame);
    return (
      <div className="w-24 h-24 border border-slate-200 rounded">
        <Diagram
          svgIdSuffix={frame}
          ctx={this.props.miniCtx}
          activeFrame={frame}
          width="96px"
          height="96px"
          miniScale={true}
          diagramAspect={this.props.diagramAspect}
          highlightCtx={highlightCtx}
          additionCtx={undefined}
        />
      </div>
    );
  }
}
