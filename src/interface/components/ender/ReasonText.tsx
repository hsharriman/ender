import { isGiven, ReasonVis } from "interface/theorems/reasons";
import React from "react";

export interface ReasonTextProps {
  activeFrame: string;
  textFn: (activeFrame: string) => ReasonVis;
}
export class ReasonText extends React.Component<ReasonTextProps> {
  render() {
    const reason = this.props.textFn(this.props.activeFrame);
    const { title, body } = reason;
    if (
      this.props.activeFrame === "prove" ||
      isGiven(reason) ||
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
        </div>
      </>
    );
  }
}
