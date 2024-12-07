import React from "react";
import { logEvent } from "../../core/testinfra/testUtils";
import { Reason } from "../../core/types/types";
import { Reasons } from "../../theorems/reasons";

export interface ReasonTextProps {
  activeFrame: string;
  textFn: (activeFrame: string) => Reason;
}
export class ReasonText extends React.Component<ReasonTextProps> {
  onMouseEnter = () => {
    logEvent("m", {
      c: "re",
      v: "",
    });
  };

  onMouseLeave = () => {
    logEvent("ml", {
      c: "re",
      v: "",
    });
  };

  render() {
    const { title, body } = this.props.textFn(this.props.activeFrame);
    if (
      this.props.activeFrame === "prove" ||
      title === Reasons.Given.title ||
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
          <div
            className="text-base"
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}
          >
            {body}
          </div>
        </div>
      </>
    );
  }
}
