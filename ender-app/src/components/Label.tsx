export interface LabelProps {
  x: number;
  y: number;
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
  private coords: [number, number];
  private val: string;

  constructor(props: LabelProps) {
    this.coords = [props.x, props.y];
    this.val = props.val;
  }

  getVal = () => {
    return this.val;
  }

  render() {
    console.log(this.val, this.coords, this.val);
    return <div style={{fontSize: "12px", color: "black", fontFamily: "sans-serif"}}>{this.val}</div>;
  }
}