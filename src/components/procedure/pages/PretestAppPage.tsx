import React from "react";
import { DiagramContent } from "../../../core/diagramContent";
import { Question } from "../../../core/testinfra/questions/testQuestions";
import { StaticDiagram } from "../../ender/StaticDiagram";

export interface PretestAppPageProps {
  name: string;
  ctx: DiagramContent;
  questions: Question[];
}
export class PretestAppPage extends React.Component<PretestAppPageProps> {
  render() {
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
