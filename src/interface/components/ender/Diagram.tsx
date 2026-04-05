import React from "react";
import { LinePatternDefs } from "../../core/diagramSvg/LinePattern";
import { SVGGeoAngle } from "../../core/diagramSvg/SVGGeoAngle";
import { SVGGeoPoint } from "../../core/diagramSvg/SVGGeoPoint";
import { SVGGeoSegment } from "../../core/diagramSvg/SVGGeoSegment";
import { SVGGeoTriangle } from "../../core/diagramSvg/SVGGeoTriangle";
import { DiagramRenderCtx, SVGModes } from "../../core/types/diagramTypes";
import { AspectRatio } from "../../core/types/layoutTypes";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: DiagramRenderCtx;
  activeFrame: string;
  width: string;
  height: string;
  miniScale: boolean;
  isStatic?: boolean;
  isTutorial?: boolean;
  additionCtx?: DiagramRenderCtx;
  highlightCtx?: DiagramRenderCtx;
  diagramAspect: AspectRatio;
}

export class Diagram extends React.Component<DiagramProps> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
  }

  renderPoints = (ctx: DiagramRenderCtx, frame: string, layer: number) => {
    return ctx.points.flatMap((p, i) => {
      let setMode = p.modes.get(frame);
      setMode = setMode === SVGModes.Unfocused ? SVGModes.Hidden : setMode;
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (setMode ?? SVGModes.Hidden);
      return !this.props.miniScale ? (
        <SVGGeoPoint
          geoId={`${p.obj.id}.${layer}`}
          mode={mode}
          hoverable={false}
          key={`${p.obj.id}-${i}.${layer}`}
          {...{
            p: p.obj.labeled(),
            offset: p.offset,
            label: p.obj.label,
            miniScale: this.props.miniScale,
            showPoint: p.showPoint,
          }}
          isHighlight={layer === 1}
        />
      ) : (
        <></>
      );
    });
  };

  renderSegments = (ctx: DiagramRenderCtx, frame: string, layer: number) => {
    return ctx.segments.flatMap((seg, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (seg.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoSegment
          geoId={`${seg.obj.id}.${layer}`}
          mode={mode}
          hoverable={false}
          {...{
            miniScale: this.props.miniScale,
            s: seg.obj.labeled(),
            tick: seg.ticks.get(frame),
          }}
          key={`${seg.obj.id}-${i}.${layer}`}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderAngles = (ctx: DiagramRenderCtx, frame: string, layer: number) => {
    return ctx.angles.flatMap((ang, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (ang.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoAngle
          mode={mode}
          geoId={`${ang.obj.id}.${layer}`}
          hoverable={false}
          {...{
            a: ang.obj.labeled(),
            miniScale: this.props.miniScale,
            tick: ang.ticks.get(frame),
          }}
          key={`${ang.obj.id}-${i}.${layer}`}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderTriangles = (ctx: DiagramRenderCtx, frame: string, layer: number) => {
    return ctx.triangles.flatMap((tri, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (tri.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoTriangle
          geoId={`${tri.obj.id}.${layer}`}
          hoverable={false}
          {...{
            miniScale: this.props.miniScale,
            t: tri.obj,
          }}
          key={`${tri.obj.id}-${i}.${layer}`}
          mode={mode}
          rotate={tri.rotatePattern}
          congruent={!this.props.isStatic && tri.congruent.has(frame)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderObjectsFromCtx = (ctx: DiagramRenderCtx, layer: number) => {
    return (
      <>
        {this.renderSegments(ctx, this.props.activeFrame, layer)}
        {this.renderTriangles(ctx, this.props.activeFrame, layer)}
        {this.renderAngles(ctx, this.props.activeFrame, layer)}
      </>
    );
  };

  renderPointsFromCtx = (ctx: DiagramRenderCtx, layer: number) => {
    return <>{this.renderPoints(ctx, this.props.activeFrame, layer)}</>;
  };

  render() {
    const aspect =
      this.props.diagramAspect === AspectRatio.Square
        ? "0 0 350 350"
        : this.props.diagramAspect === AspectRatio.Landscape
          ? "0 0 475 300"
          : "0 0 300 500";
    return (
      <div
        style={{
          width: this.props.width,
          height: this.props.height,
        }}
      >
        <svg
          id={this.svgId}
          viewBox={aspect}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {LinePatternDefs}
          {/* Render non-point geometry first. */}
          {this.renderObjectsFromCtx(this.props.ctx, 0)}
          {/* Render dependency highlights (ReliesOn) before derived additions. */}
          {this.props.highlightCtx &&
            this.props.highlightCtx.frames.filter(
              (f) => f === this.props.activeFrame,
            ).length > 0 &&
            this.renderObjectsFromCtx(this.props.highlightCtx, 1)}
          {this.props.additionCtx &&
            this.renderObjectsFromCtx(this.props.additionCtx, 2)}

          {/* Render all points last so they stay on top. */}
          {this.renderPointsFromCtx(this.props.ctx, 0)}
          {this.props.highlightCtx &&
            this.props.highlightCtx.frames.filter(
              (f) => f === this.props.activeFrame,
            ).length > 0 &&
            this.renderPointsFromCtx(this.props.highlightCtx, 1)}
          {this.props.additionCtx &&
            this.renderPointsFromCtx(this.props.additionCtx, 2)}
        </svg>
      </div>
    );
  }
}
