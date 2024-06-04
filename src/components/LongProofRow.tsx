import React, { createRef } from "react";
import { ProofTextItem } from "../core/types/stepTypes";
import { LongFormReliesOn } from "./LongFormReliesOn";

export interface LongProofRowProps {
  reliesOn?: Map<string, string[]>;
  item: ProofTextItem;
  idx: number;
}

export interface LongProofRowState {
  rect: DOMRect;
}
export class LongProofRow extends React.Component<
  LongProofRowProps,
  LongProofRowState
> {
  ref: React.RefObject<HTMLDivElement>;
  constructor(props: LongProofRowProps) {
    super(props);
    this.ref = createRef<HTMLDivElement>();
    this.state = {
      rect: new DOMRect(),
    };
  }

  componentDidMount = () => {
    // TODO placement is weirdly affected by scroll position
    if (this.ref.current) {
      const rect = this.ref.current.getBoundingClientRect();
      this.setState({ rect });
    }
  };

  render() {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    const item = this.props.item;
    return (
      <div className="h-16" key={item.k}>
        <div
          id={`proofrow-${item.k}`}
          className="border-gray-200 border-b-2 w-11/12 h-16 ml-2 text-lg"
          ref={this.ref}
        >
          <div
            className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-8 align-center`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 col-span-4 font-bold">
              <div className="text-slate-400 font-bold">
                {this.props.idx + 1}
              </div>
              {item.v}
            </div>
            <div className="flex flex-row justify-start col-span-4 font-semibold">
              {item.reason}
            </div>
          </div>
        </div>
        {this.props.reliesOn?.get(item.k) && (
          <LongFormReliesOn
            reliesOn={this.props.reliesOn!.get(item.k)!}
            parentFrameId={item.k}
            rowHeight={28}
            rect={this.state.rect}
          />
        )}
      </div>
    );
  }
}
