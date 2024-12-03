import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { GIVEN_ID } from "../../theorems/utils";
import { Diagram } from "./Diagram";

export interface DiagramProps {
  svgIdSuffix: string;
  ctx: DiagramContent;
  width: string;
  height: string;
  activeFrame?: string;
}

export class StaticDiagram extends React.Component<DiagramProps, {}> {
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
      />
    );
  }
}
