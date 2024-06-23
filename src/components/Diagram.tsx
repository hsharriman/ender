import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { SVGGeometryAngle } from "../core/svg/geometry/SVGGeometryAngle";
import { SVGGeometryPoint } from "../core/svg/geometry/SVGGeometryPoint";
import { SVGGeometrySegment } from "../core/svg/geometry/SVGGeometrySegment";
import { SVGModes } from "../core/types/types";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: DiagramContent;
  activeFrame: string;
  width: string;
  height: string;
  miniScale: boolean;
}

interface DiagramState {
  activeFrame: string;
}

export class Diagram extends React.Component<DiagramProps, DiagramState> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-object-${props.svgIdSuffix}`;
    this.state = {
      activeFrame: this.props.activeFrame,
    };
  }

  renderPoints = () => {
    return this.props.ctx.points.flatMap((p, i) => {
      return (
        <SVGGeometryPoint
          geoId={p.id}
          mode={this.props.miniScale ? SVGModes.Hidden : SVGModes.Default}
          hoverable={!this.props.miniScale}
          key={`${p.id}-${i}`}
          {...{
            p: p.labeled(),
            offset: p.offset,
            label: p.label,
            miniScale: this.props.miniScale,
          }}
        />
      );
    });
  };

  renderSegments = (frame: string) => {
    return this.props.ctx.segments.flatMap((seg, i) => {
      return (
        <SVGGeometrySegment
          geoId={seg.id}
          mode={seg.getMode(frame) ?? SVGModes.Hidden}
          hoverable={!this.props.miniScale}
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

  renderAngles = (frame: string) => {
    return this.props.ctx.angles.flatMap((ang, i) => {
      return (
        <SVGGeometryAngle
          mode={ang.getMode(frame) ?? SVGModes.Hidden}
          geoId={ang.id}
          hoverable={!this.props.miniScale}
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

  render() {
    return (
      <div style={{ width: this.props.width, height: this.props.height }}>
        <svg
          id={this.svgId}
          viewBox="0 0 500 350"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* {this.props.svgElements(this.props.activeFrame)} */}
          {this.renderPoints()}
          {this.renderAngles(this.props.activeFrame)}
          {this.renderSegments(this.props.activeFrame)}
        </svg>
      </div>
    );
  }
}
