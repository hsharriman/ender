import React from "react";
import { logEvent } from "../../core/testinfra/testUtils";
import { Reason } from "../../core/types/types";
import { Reasons } from "../../theorems/reasons";

export interface ReasonTextProps {
  activeFrame: string;
  textFn: (activeFrame: string) => Reason;
  displayHeader: boolean;
}
export class ReasonText extends React.Component<ReasonTextProps> {
  constructor(props: ReasonTextProps) {
    super(props);
  }

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
    return (
      <>
        <div className="flex flex-col justify-start">
          <div
            className="font-bold text-base text-slate-500"
            style={
              title.length > 0 &&
              title !== Reasons.Given.title &&
              this.props.displayHeader
                ? { opacity: 1 }
                : { opacity: 0 }
            }
          >
            Reason Applied:
          </div>
          <div
            className="font-bold text-base"
            style={
              this.props.displayHeader && title !== Reasons.Given.title
                ? { display: "block" }
                : { display: "none" }
            }
          >
            {title}
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
