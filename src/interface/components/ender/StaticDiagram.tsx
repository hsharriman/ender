import React from "react";
import { DiagramRenderCtx } from "../../core/types/diagramTypes";
import { AspectRatio } from "../../core/types/layoutTypes";
import { GIVEN_ID } from "../../theorems/utils";
import { Diagram } from "./Diagram";

export interface StaticDiagramProps {
  svgIdSuffix: string;
  ctx: DiagramRenderCtx;
  width: string;
  height: string;
  activeFrame?: string;
  diagramAspect: AspectRatio;
}

export class StaticDiagram extends React.Component<StaticDiagramProps, {}> {
  render() {
    return (
      <Diagram
        svgIdSuffix={this.props.svgIdSuffix}
        ctx={this.props.ctx}
        width={this.props.width}
        height={this.props.height}
        activeFrame={this.props.activeFrame || GIVEN_ID}
        miniScale={false}
        isTutorial={false}
        isStatic={true}
        diagramAspect={this.props.diagramAspect}
      />
    );
  }
}
