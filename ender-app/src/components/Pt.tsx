import { BasicObject, BasicObjectProps } from "./BasicObject";
import { Label } from "./Label";

// eventually will have render function too
export interface PtProps extends BasicObjectProps{
  x: number;
  y: number;
  label: string;
}

export class Pt extends BasicObject {
  private coords: [number, number];
  private label: Label;
  constructor(props: PtProps) {
    super(props.id);
    this.coords = [props.x, props.y];
    this.label = new Label({x: props.x, y: props.y, val: props.label});
  }

  render () {
    console.log();
    return <>{`${this.coords}`} ${this.label.getVal()}</>;
  }
}