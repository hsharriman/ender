import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { StaticDiagram } from "./StaticDiagram";

interface PretestAppPageProps {
  ctx?: DiagramContent;
}
export class PretestAppPage extends React.Component<PretestAppPageProps> {
  render() {
    if (!this.props.ctx) {
      return (
        <div className="w-full flex justify-center m-4">
          <h1>This page is intentionally left blank.</h1>
        </div>
      );
    }
    return (
      <>
        <div className="w-full flex justify-center mt-4">
          <div className="border-slate-300 border-r-2 rounded-md shadow-md">
            <StaticDiagram
              svgIdSuffix="pretest"
              ctx={this.props.ctx}
              width="600px"
              height="500px"
            />
          </div>
        </div>
      </>
    );
  }
}
