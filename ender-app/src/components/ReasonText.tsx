import React from "react";
import { Reason } from "../core/types";

export interface ReasonTextProps {
  activeFrame: string;
  textFn: (activeFrame: string) => Reason;
}
export class ReasonText extends React.Component<ReasonTextProps> {
  constructor(props: ReasonTextProps) {
    super(props);
  }

  render() {
    const { title, body } = this.props.textFn(this.props.activeFrame);
    return (
      <>
        <div className="flex flex-col justify-start">
          <div
            className="font-bold text-base text-slate-500"
            style={title.length > 0 ? { opacity: 1 } : { opacity: 0 }}
          >
            Reason Applied:
          </div>
          <div className="font-bold text-base">{title}</div>
          <div className="text-base">{body}</div>
        </div>
      </>
    );
  }
}
