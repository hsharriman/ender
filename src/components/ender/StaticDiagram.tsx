import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { SVGGeoAngle } from "../../core/diagramSvg/SVGGeoAngle";
import { SVGGeoPoint } from "../../core/diagramSvg/SVGGeoPoint";
import { SVGGeoSegment } from "../../core/diagramSvg/SVGGeoSegment";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { SVGModes } from "../../core/types/types";
import { GIVEN_ID } from "../../theorems/utils";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: DiagramContent;
  width: string;
  height: string;
}

export class StaticDiagram extends React.Component<DiagramProps, {}> {
  private svgId: string;

  constructor(props: DiagramProps) {
    super(props);
    this.svgId = `svg-static-object-${props.svgIdSuffix}`;
  }

  render() {
    const aspect =
      this.props.ctx.aspect === AspectRatio.Square
        ? "0 0 350 350"
        : this.props.ctx.aspect === AspectRatio.Landscape
        ? "0 0 475 300"
        : "0 0 300 500";
    return (
      <div style={{ width: this.props.width, height: this.props.height }}>
        <svg
          id={this.svgId}
          viewBox={aspect}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {this.props.ctx.points.flatMap((p, i) => {
            return (
              <SVGGeoPoint
                geoId={p.id}
                mode={SVGModes.Default}
                hoverable={false}
                key={`${p.id}-${i}`}
                {...{
                  p: p.labeled(),
                  offset: p.offset,
                  label: p.label,
                  miniScale: false,
                  showPoint: p.showPoint,
                }}
              />
            );
          })}
          {this.props.ctx.angles.flatMap((ang, i) => {
            return (
              <SVGGeoAngle
                mode={ang.getMode(GIVEN_ID) ?? SVGModes.Hidden}
                geoId={ang.id}
                hoverable={false}
                {...{
                  a: ang.labeled(),
                  miniScale: false,
                  tick: ang.getTick(GIVEN_ID),
                }}
                key={`${ang.id}-${i}-static`}
              />
            );
          })}
          {this.props.ctx.segments.flatMap((seg, i) => {
            return (
              <SVGGeoSegment
                geoId={seg.id}
                mode={seg.getMode(GIVEN_ID) ?? SVGModes.Hidden}
                hoverable={false}
                {...{
                  miniScale: false,
                  s: seg.labeled(),
                  tick: seg.getTick(GIVEN_ID),
                }}
                key={`${seg.id}-${i}-static`}
              />
            );
          })}
        </svg>
      </div>
    );
  }
}
