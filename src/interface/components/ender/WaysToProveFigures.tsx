import React from "react";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { DiagramRenderCtx } from "../../core/types/diagramTypes";
import { ProofTextItem } from "../../core/types/stepTypes";
import { ReasonMiniVisual } from "./ReasonMiniVisual";

interface WaysToProveFiguresProps {
  activeFrame: string;
  linkedTexts: ProofTextItem[];
  miniReasonCtxMap: Map<string, DiagramRenderCtx[]>;
  diagramAspect: AspectRatio;
}

export class WaysToProveFigures extends React.Component<WaysToProveFiguresProps> {
  private getActiveItem = (): ProofTextItem | undefined =>
    this.props.linkedTexts.find((item) => item.k === this.props.activeFrame);

  render() {
    const activeItem = this.getActiveItem();
    const candidates = activeItem?.waysToProve?.candidates ?? [];
    const miniCtxs =
      this.props.miniReasonCtxMap.get(this.props.activeFrame) ?? [];
    if (
      !activeItem?.reason ||
      activeItem.reason === "Given" ||
      candidates.length === 0
    )
      return <></>;
    return (
      <div className="mt-4 w-[650px]">
        <div className="flex flex-row flex-wrap gap-2">
          {candidates.map((candidate, idx) => (
            <div
              key={`${this.props.activeFrame}-mini-${idx}`}
              className="flex flex-col"
            >
              <ReasonMiniVisual
                candidate={candidate}
                miniCtx={miniCtxs[idx]}
                diagramAspect={this.props.diagramAspect}
              />
              <div className="text-xs text-slate-500 mt-1">
                {(candidate.completion * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-700 mt-1 max-w-[180px]">
                {`${candidate.reasonFunction} -> ${candidate.contributors.join(", ")}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
