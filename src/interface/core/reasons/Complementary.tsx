import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class Complementary {
  private static addition = " + ";
  private static equalLine = " = 90°";
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {BaseAngle.text(a1)(isActive)}
          {this.addition}
          {BaseAngle.text(a2)(isActive)}
          {this.equalLine}
        </span>
      );
    };

  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    BaseAngle.additions(props, a1);
    BaseAngle.additions(props, a2);
  };
}
