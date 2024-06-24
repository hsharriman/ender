import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { SVGModes } from "../core/types/types";
import { SVGGeoAngle } from "../core/svg/SVGGeoAngle";
import { SVGGeoPoint } from "../core/svg/SVGGeoPoint";
import { SVGGeoSegment } from "../core/svg/SVGGeoSegment";

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
      return !this.props.miniScale ? (
        <SVGGeoPoint
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
      ) : (
        <></>
      );
    });
  };

  renderSegments = (frame: string) => {
    return this.props.ctx.segments.flatMap((seg, i) => {
      if (seg.getTick(frame)) {
        console.log(seg.id, frame, seg.ticks, seg.getTick(frame));
      }
      return (
        <SVGGeoSegment
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
      if (ang.getTick(frame)) {
        console.log(ang.id, frame, ang.ticks, ang.getTick(frame));
      }
      return (
        <SVGGeoAngle
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
          {this.renderSegments(this.props.activeFrame)}
          {this.renderAngles(this.props.activeFrame)}
        </svg>
      </div>
    );
  }
}
