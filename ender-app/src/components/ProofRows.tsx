import React from "react";
import { ProofItem } from "./ProofItem";

export interface ProofRowsProps {
  active: number;
  items: ProofItem[];
  onClick: (n: number) => void; // callback that returns new selected idx when clicked
}
export interface ProofRowsState {
  active: number;
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
    const idx = parseInt(event.currentTarget.id.replace(this.idPrefix, ""));
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
      return this.props.items.map((item, idx) => {
        return (
          <button
            id={`prooftext-${idx}`}
            onClick={this.onClick}
            className="py-4 border-black border-r-2 border-2"
          >
            {item.renderText()}
          </button>
        );
      });
    }
    return <></>;
  }
}
