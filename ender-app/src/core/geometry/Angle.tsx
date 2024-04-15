import { Obj, LAngle, SVGModes, TickType } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Tick } from "./Tick";
import { ModeCSS } from "../svg/SVGStyles";

export type AngleProps = {
  start: Point;
  center: Point;
  end: Point;
} & BaseGeometryProps;
export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  private id: string;
  // private ticks: Tick;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(Obj.Angle, props);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = [
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ];
    this.id = this.getId(Obj.Angle, this.label);
    // this.ticks = new Tick({ parent: this.labeled() });
  }

  // private tick = (
  //   frameKey: string,
  //   tick: TickType,
  //   mode: SVGModes,
  //   numTicks: number = 1
  // ) => {
  //   switch (tick) {
  //     case Obj.EqualAngleTick:
  //       return this.equalAngleMark(frameKey, mode, numTicks);
  //     case Obj.ParallelTick:
  //       console.error(`cannot set ${tick} on angle type`);
  //       return this;
  //     case Obj.EqualLengthTick:
  //       console.error(`cannot set ${tick} on angle type`);
  //       return this;
  //     default:
  //       return this;
  //   }
  // };

  // equalAngleMark = (frameKey: string, mode: SVGModes, numTicks: number) => {
  //   this.ticks.addTickMeta(frameKey, {
  //     type: Obj.EqualAngleTick,
  //     num: numTicks,
  //     mode: mode,
  //     id: "", // TODO not right
  //   });
  //   return this;
  // };

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    // return this.ticks ? this.ticks.svg(frameIdx, miniScale, style) : [<></>];
    return <></>;
  };

  // override onClickText = (isActive: boolean) => {
  //   const setStyle = (ele: HTMLElement | null) => {
  //     if (ele) {
  //       const cls = ModeCSS.ACTIVE.split(" ");
  //       isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
  //     }
  //   };
  //   // update style for each tick mark
  //   // TODO readd functionality
  //   // const tickLabel = this.ticks.getLabels(active);
  //   // if (tickLabel) {
  //   //   const ele = document.getElementById(tickLabel);
  //   //   setStyle(ele);
  //   // }
  // };

  // linkedText = (activeFrame: string, label: string) => {
  //   return (
  //     <LinkedText
  //       val={label}
  //       clickCallback={this.onClickText(activeFrame)}
  //       type={Obj.Angle}
  //     />
  //   );
  // };

  // override mode = (
  //   frameKey: string,
  //   mode: SVGModes
  //   // tick?: TickType,
  //   // numTicks?: number
  // ) => {
  //   // if (this.ticks) {
  //   //   this.ticks.mode(frameKey, mode);
  //   // }
  //   // if (tick) {
  //   //   this.tick(frameKey, tick, mode, numTicks);
  //   // }
  //   this.modes.set(frameKey, mode);
  //   return this;
  // };

  // hideTick = (frameKey: string) => {
  //   this.ticks.addTickMeta(frameKey, {
  //     mode: SVGModes.Hidden,
  //     type: Obj.HiddenTick,
  //     num: 0,
  //     id: "",
  //   });
  //   return this;
  // };
}
