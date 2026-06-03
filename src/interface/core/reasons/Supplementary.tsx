import { BaseAngle } from "./BaseAngle";

// TODO how to visually represent supplementary angles
export class Supplementary {
  private static addition = " + ";
  private static equalNinety = " = 180°";
  // static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
  //   RightAngle.additions({ ...props }, a1);
  //   RightAngle.additions({ ...props, mode: props.mode }, a2);
  // };
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {BaseAngle.text(a1)(isActive)}
          {this.addition}
          {BaseAngle.text(a2)(isActive)}
          {this.equalNinety}
        </span>
      );
    };
  // static highlight = (
  //   props: StepProps,
  //   [a1, a2]: [string, string],
  //   mode: SVGModes,
  // ) => {
  //   const { ctx, frame } = props;
  //   ctx.getAngle(a1)?.addTick(frame, Obj.RightTick).mode(frame, mode);
  //   ctx.getAngle(a2)?.addTick(frame, Obj.RightTick).mode(frame, mode);
  // };
}
