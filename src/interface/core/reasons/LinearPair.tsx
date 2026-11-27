import { comma } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class LinearPair {
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {BaseAngle.text(a1)(isActive)}
          {comma}
          {BaseAngle.text(a2)(isActive)}
          {" are a linear pair"}
        </span>
      );
    };

  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    BaseAngle.additions(props, a1);
    BaseAngle.additions(props, a2);
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
