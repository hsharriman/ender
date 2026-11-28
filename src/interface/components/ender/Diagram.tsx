import { ProofCtx } from "geometry-object";
import { SVGGeoArc } from "interface/core/diagramSvg/SVGGeoArc";
import React from "react";
import { LinePatternDefs } from "../../core/diagramSvg/LinePattern";
import { SVGGeoAngle } from "../../core/diagramSvg/SVGGeoAngle";
import { SVGGeoCircle } from "../../core/diagramSvg/SVGGeoCircle";
import { SVGGeoPoint } from "../../core/diagramSvg/SVGGeoPoint";
import { SVGGeoSegment } from "../../core/diagramSvg/SVGGeoSegment";
import { SVGGeoTriangle } from "../../core/diagramSvg/SVGGeoTriangle";
import { SVGModes } from "../../core/types/diagramTypes";
import { AspectRatio } from "../../core/types/layoutTypes";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: ProofCtx;
  activeFrame: string;
  width: string;
  height: string;
  miniScale: boolean;
  isStatic?: boolean;
  isTutorial?: boolean;
  additionCtx?: ProofCtx;
  highlightCtx?: ProofCtx;
  diagramAspect: AspectRatio;
}

export class Diagram extends React.Component<DiagramProps> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
  }

  private geoId = (objId: string, layer: number) => `${objId}.${layer}`;
  private keyId = (objId: string, layer: number, idx: number) =>
    `${objId}-${idx}-${layer}`;

  renderPoints = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.points.flatMap((p, i) => {
      let setMode = p.modes.get(frame);
      setMode = setMode === SVGModes.Unfocused ? SVGModes.Hidden : setMode;
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (setMode ?? SVGModes.Hidden);
      return (
        <SVGGeoPoint
          geoId={this.geoId(p.id, layer)}
          mode={mode}
          hoverable={false}
          key={this.keyId(p.id, layer, i)}
          {...{
            p: p,
            offset: p.offset,
            label: p.label,
            miniScale: this.props.miniScale,
            showPoint: p.showPoint,
          }}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderSegments = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.segments.flatMap((seg, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (seg.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoSegment
          geoId={this.geoId(seg.id, layer)}
          mode={mode}
          hoverable={false}
          {...{
            miniScale: this.props.miniScale,
            s: seg,
            tick: seg.ticks.get(frame),
          }}
          key={this.keyId(seg.id, layer, i)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderAngles = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.angles.flatMap((ang, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (ang.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoAngle
          mode={mode}
          geoId={this.geoId(ang.id, layer)}
          hoverable={false}
          {...{
            a: ang,
            miniScale: this.props.miniScale,
            tick: ang.ticks.get(frame),
          }}
          key={this.keyId(ang.id, layer, i)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderTriangles = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.triangles.flatMap((tri, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (tri.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoTriangle
          geoId={this.geoId(tri.id, layer)}
          hoverable={false}
          {...{
            miniScale: this.props.miniScale,
            t: tri,
          }}
          key={this.keyId(tri.id, layer, i)}
          mode={mode}
          rotate={tri.rotatePattern}
          similar={!this.props.isStatic && tri.similar.has(frame)}
          congruent={!this.props.isStatic && tri.congruent.has(frame)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderCircles = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.circles.flatMap((circle, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (circle.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoCircle
          geoId={this.geoId(circle.id, layer)}
          mode={mode}
          hoverable={false}
          {...{ c: circle, miniScale: this.props.miniScale }}
          key={this.keyId(circle.id, layer, i)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderArcs = (ctx: ProofCtx, frame: string, layer: number) => {
    return ctx.arcs.flatMap((arc, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : (arc.modes.get(frame) ?? SVGModes.Hidden);
      return (
        <SVGGeoArc
          geoId={this.geoId(arc.id, layer)}
          mode={mode}
          hoverable={false}
          {...{ a: arc, miniScale: this.props.miniScale }}
          key={this.keyId(arc.id, layer, i)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderObjectsFromCtx = (ctx: ProofCtx, layer: number) => {
    return (
      <>
        {this.renderSegments(ctx, this.props.activeFrame, layer)}
        {this.renderTriangles(ctx, this.props.activeFrame, layer)}
        {this.renderAngles(ctx, this.props.activeFrame, layer)}
        {this.renderCircles(ctx, this.props.activeFrame, layer)}
        {this.renderArcs(ctx, this.props.activeFrame, layer)}
      </>
    );
  };

  renderPointsFromCtx = (ctx: ProofCtx, layer: number) => {
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
