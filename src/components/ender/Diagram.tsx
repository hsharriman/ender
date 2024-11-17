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
  highlightCtx?: DiagramContent;
}

export class Diagram extends React.Component<DiagramProps> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
  }

  renderPoints = (ctx: DiagramContent, frame: string, highlight: boolean) => {
    return ctx.points.flatMap((p, i) => {
      const hoverable = this.props.isStatic ? false : p.hoverable;
      return !this.props.miniScale ? (
        <SVGGeoPoint
          geoId={p.id}
          mode={this.props.miniScale ? SVGModes.Hidden : SVGModes.Default}
          hoverable={hoverable}
          highlight={highlight && p.getHighlight(frame)}
          key={`${p.id}-${i}`}
          {...{
            p: p.labeled(),
            offset: p.offset,
            label: p.label,
            miniScale: this.props.miniScale,
            showPoint: p.showPoint,
          }}
        />
      ) : (
        <></>
      );
    });
  };

  renderSegments = (ctx: DiagramContent, frame: string, highlight: boolean) => {
    return ctx.segments.flatMap((seg, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : seg.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : seg.hoverable;
      return (
        <SVGGeoSegment
          geoId={seg.id}
          mode={mode}
          hoverable={hoverable}
          highlight={highlight && seg.getHighlight(frame)}
          {...{
            miniScale: this.props.miniScale,
            s: seg.labeled(),
            tick: seg.getTick(frame),
          }}
          key={`${seg.id}-${i}`}
        />
      );
    });
  };

  renderAngles = (ctx: DiagramContent, frame: string, highlight: boolean) => {
    return ctx.angles.flatMap((ang, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : ang.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : ang.hoverable;
      return (
        <SVGGeoAngle
          mode={mode}
          geoId={ang.id}
          hoverable={hoverable}
          highlight={highlight && ang.getHighlight(frame)}
          {...{
            a: ang.labeled(),
            miniScale: this.props.miniScale,
            tick: ang.getTick(frame),
          }}
          key={`${ang.id}-${i}`}
        />
      );
    });
  };

  renderTriangles = (
    ctx: DiagramContent,
    frame: string,
    highlight: boolean
  ) => {
    return ctx.triangles.flatMap((tri, i) => {
      const mode = this.props.isStatic
        ? SVGModes.Default
        : tri.getMode(frame) ?? SVGModes.Hidden;
      const hoverable = this.props.isStatic ? false : tri.hoverable;
      return (
        <SVGGeoTriangle
          geoId={tri.id}
          hoverable={hoverable}
          highlight={highlight && tri.getHighlight(frame)}
          {...{
            miniScale: this.props.miniScale,
            t: tri,
          }}
          key={`${tri.id}-${i}`}
          backgroundColor={tri.backgroundColor}
          mode={mode}
        />
      );
    });
  };

  renderObjectsFromCtx = (ctx: DiagramContent, highlight: boolean) => {
    return (
      <>
        {this.renderSegments(ctx, this.props.activeFrame, highlight)}
        {this.renderTriangles(ctx, this.props.activeFrame, highlight)}
        {this.renderPoints(ctx, this.props.activeFrame, highlight)}
        {this.renderAngles(ctx, this.props.activeFrame, highlight)}
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
          {this.props.highlightCtx &&
            this.props.highlightCtx.frames.filter(
              (f) => f === this.props.activeFrame
            ).length > 0 &&
            this.renderObjectsFromCtx(this.props.highlightCtx, true)}
          {this.renderObjectsFromCtx(this.props.ctx, false)}
        </svg>
      </div>
    );
  }
}
