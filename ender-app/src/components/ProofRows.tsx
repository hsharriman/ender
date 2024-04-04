import React from "react";
import { ProofItem } from "./ProofItem";
import { ProofTextItem } from "../core/types";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
}
export interface ProofRowsState {
  active: string;
}
export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";
  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      active: this.props.active,
    };
  }

  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const idx = event.currentTarget.id.replace(this.idPrefix, "");
    if (idx !== this.state.active) {
      this.setState({
        active: idx,
      });
      this.props.onClick(idx);
    }
  };

  render() {
    // TODO change style based on the state
    if (this.props.items.length > 0) {
      return this.props.items.map((item) => {
        return (
          <button
            id={`${this.idPrefix}${item.k}`}
            onClick={this.onClick}
            className="py-4 border-b-2 border-gray-300"
          >
            {item.v}
          </button>
        );
      });
    }
    return <></>;
  }
}
