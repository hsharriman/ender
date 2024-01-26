import { Vector } from "../core/types";

export interface LabelProps {
  pt: Vector;
  val: string;
}

// this.display = {
//   shape: "circle",
//   width: "3px",
//   color: "black",
// };
// this.label = {
//   fontSize: "12px",
//   fontColor: "black",
//   fontFamily: "tex"
// };

export class Label {
  private pt: [number, number];
  private val: string;

  constructor(props: LabelProps) {
    this.pt = props.pt;
    this.val = props.val;
  }

  getVal = () => {
    return this.val;
  };

  render() {
    return (
      <div
        style={{ fontSize: "12px", color: "black", fontFamily: "sans-serif" }}
      >
        {this.val}
      </div>
    );
  }
}
