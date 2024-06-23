import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { SVGGeometryAngle } from "../core/svg/geometry/SVGGeometryAngle";
import { SVGGeometrySegment } from "../core/svg/geometry/SVGGeometrySegment";
import { SVGModes } from "../core/types/types";
import { GIVEN_ID } from "../theorems/utils";

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
          {this.props.ctx.angles.flatMap((ang, i) => {
            return (
              <SVGGeometryAngle
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
              <SVGGeometrySegment
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
