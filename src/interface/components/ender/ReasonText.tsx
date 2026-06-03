import { reasonFromFunction } from "interface/theorems/reasons";
import React from "react";
import { Reason } from "../../core/types/layoutTypes";

export interface ReasonTextProps {
  activeFrame: string;
  textFn: (activeFrame: string) => Reason;
}
export class ReasonText extends React.Component<ReasonTextProps> {
  render() {
    const { title, body, expectedDependenciesDescription } = this.props.textFn(
      this.props.activeFrame,
    );
    if (
      this.props.activeFrame === "prove" ||
      title === reasonFromFunction("given").title ||
      title.length === 0
    ) {
      return <></>;
    }
    return (
      <>
        <div className="flex flex-col justify-start">
          <div className="flex flex-row items-baseline pb-1">
            <div className="font-bold text-lg text-slate-500 mr-2">
              Reason Applied:
            </div>
            <div
              className={`block border-black border-2 font-bold text-base px-2 rounded-md py-1 w-fit`}
            >
              {title}
            </div>
          </div>
          <div className="text-base">{body}</div>
          {expectedDependenciesDescription ? (
            <div className="text-base text-slate-600 mt-2">
              {expectedDependenciesDescription}
            </div>
          ) : null}
        </div>
      </>
    );
  }
}
