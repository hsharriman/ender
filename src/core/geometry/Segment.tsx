import { ModeCSS } from "../svg/SVGStyles";
import { LSegment, Obj, SVGModes, TickType } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";

export type SegmentProps = {
  p1: Point;
  p2: Point;
} & BaseGeometryProps;
export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  private ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  constructor(props: SegmentProps) {
    super(Obj.Segment, props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.id =
      props.parentFrame !== undefined
        ? `${props.parentFrame}-${this.id}`
        : this.id;
    this.names = this.permutator([this.p1.label, this.p2.label]);
    this.ticks = new Map<string, { type: TickType; num: number }>();
  }
  // deprecated?
  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  override mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  getMode = (frameKey: string) => this.modes.get(frameKey);

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
  };

  inheritTick = (frame: string, prevFrame: string) => {
    this.ticks.get(prevFrame) &&
      this.ticks.set(frame, this.ticks.get(prevFrame)!);
  };

  hideTick = (frame: string) => {
    this.ticks.delete(frame);
  };

  getTick = (frame: string) => this.ticks.get(frame);

  frameElements = (frame: string) => {
    if (this.modes.has(frame)) {
      return {
        mode: this.modes.get(frame) ?? SVGModes.Hidden,
        tick: this.ticks.get(frame),
        s: this.labeled(),
      };
    }
    return;
  };

  // TODO used in linkedText, needs a better location? Could just put in linkedText if linkedText knows the id
  override onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMGLOW.split(" ");

        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    };
    const ele = document.getElementById(this.id);
    const eleTick = document.getElementById(`${this.id}-tick`);
    setStyle(ele);
    setStyle(eleTick);
  };

  // svg = (
  //   frameIdx: string,
  //   pageNum: number,
  //   miniScale = false,
  //   style?: React.CSSProperties
  // ) => {
  //   let svgItems: JSX.Element[] = [];
  //   // add line
  //   svgItems.push(
  //     <SVGLine
  //       {...{
  //         start: this.coordsToSvg(this.p1.pt, miniScale),
  //         end: this.coordsToSvg(this.p2.pt, miniScale),
  //         geoId: this.id,
  //         style: style, // TODO needed?
  //         mode: this.modes.get(frameIdx) ?? SVGModes.Hidden,
  //         activeFrame: frameIdx,
  //         hoverable: this.hoverable,
  //       }}
  //       key={`${this.id}-${pageNum}`}
  //     />
  //   );
  //   // tick should get rendered at this level for segments and angles
  //   // tick can either be equallength or parallel, visible or invisible. it will always have the same mode as the segment
  //   // if the frameIdx finds a tick, then render here otherwise do nothing
  //   return svgItems;
  // };
}
