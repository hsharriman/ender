import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { SVGGeoAngle } from "../../core/diagramSvg/SVGGeoAngle";
import { SVGGeoPoint } from "../../core/diagramSvg/SVGGeoPoint";
import { SVGGeoSegment } from "../../core/diagramSvg/SVGGeoSegment";
import { SVGGeoTriangle } from "../../core/diagramSvg/SVGGeoTriangle";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { SVGModes } from "../../core/types/types";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: DiagramContent;
  activeFrame: string;
  width: string;
  height: string;
  miniScale: boolean;
  isStatic?: boolean;
  isTutorial?: boolean;
  additionCtx?: DiagramContent;
  highlightCtx?: DiagramContent;
}

export class Diagram extends React.Component<DiagramProps> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
  }

  renderPoints = (ctx: DiagramContent, frame: string, layer: number) => {
    return ctx.points.flatMap((p, i) => {
      const hoverable = this.props.isStatic ? false : p.hoverable;
      const mode = this.props.isStatic
        ? SVGModes.Default
        : p.getMode(frame) ?? SVGModes.Hidden;
      return !this.props.miniScale ? (
        <SVGGeoPoint
          geoId={`${p.id}.${layer}`}
          mode={mode}
          hoverable={hoverable}
          key={`${p.id}-${i}.${layer}`}
          {...{
            p: p.labeled(),
            offset: p.offset,
            label: p.label,
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

  renderSegments = (ctx: DiagramContent, frame: string, layer: number) => {
    return ctx.segments.flatMap((seg, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : seg.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : seg.hoverable;
      return (
        <SVGGeoSegment
          geoId={`${seg.id}.${layer}`}
          mode={mode}
          hoverable={hoverable}
          {...{
            miniScale: this.props.miniScale,
            s: seg.labeled(),
            tick: seg.getTick(frame),
          }}
          key={`${seg.id}-${i}.${layer}`}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderAngles = (ctx: DiagramContent, frame: string, layer: number) => {
    return ctx.angles.flatMap((ang, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : ang.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : ang.hoverable;
      return (
        <SVGGeoAngle
          mode={mode}
          geoId={`${ang.id}.${layer}`}
          hoverable={hoverable}
          {...{
            a: ang.labeled(),
            miniScale: this.props.miniScale,
            tick: ang.getTick(frame),
          }}
          key={`${ang.id}-${i}.${layer}`}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderTriangles = (ctx: DiagramContent, frame: string, layer: number) => {
    return ctx.triangles.flatMap((tri, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : tri.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : tri.hoverable;
      return (
        <SVGGeoTriangle
          geoId={`${tri.id}.${layer}`}
          hoverable={hoverable}
          {...{
            miniScale: this.props.miniScale,
            t: tri,
          }}
          key={`${tri.id}-${i}.${layer}`}
          backgroundColor={tri.backgroundColor}
          mode={mode}
          congruent={!this.props.isStatic && tri.congruent.has(frame)}
          isHighlight={layer === 1}
        />
      );
    });
  };

  renderObjectsFromCtx = (ctx: DiagramContent, layer: number) => {
    return (
      <>
        {this.renderSegments(ctx, this.props.activeFrame, layer)}
        {this.renderTriangles(ctx, this.props.activeFrame, layer)}
        {this.renderPoints(ctx, this.props.activeFrame, layer)}
        {this.renderAngles(ctx, this.props.activeFrame, layer)}
      </>
    );
  };

  render() {
    const aspect =
      this.props.ctx.aspect === AspectRatio.Square
        ? "0 0 350 350"
        : this.props.ctx.aspect === AspectRatio.Landscape
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
          {this.renderObjectsFromCtx(this.props.ctx, 0)}
          {this.props.additionCtx &&
            this.renderObjectsFromCtx(this.props.additionCtx, 2)}
          {this.props.highlightCtx &&
            this.props.highlightCtx.frames.filter(
              (f) => f === this.props.activeFrame
            ).length > 0 &&
            this.renderObjectsFromCtx(this.props.highlightCtx, 1)}
        </svg>
      </div>
    );
  }
}
