import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { SVGModes } from "../core/types/types";
import { GIVEN_ID } from "../theorems/utils";
import { SVGGeoAngle } from "../core/svg/SVGGeoAngle";
import { SVGGeoPoint } from "../core/svg/SVGGeoPoint";
import { SVGGeoSegment } from "../core/svg/SVGGeoSegment";

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
    return (
      <div>
        <svg
          id={this.svgId}
          viewBox="0 0 500 300"
          width={this.props.width}
          height={this.props.height}
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
