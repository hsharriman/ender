import { LinkedText } from "../components/LinkedText";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { Content } from "../core/objgraph";
import { Reason, SVGModes } from "../core/types";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";
export interface Step {
  cls: StepCls;
  reason: Reason;
  dependsOn?: number[];
}

export interface StepUnfocusProps {
  ctx: Content;
  frame: string;
  inPlace: boolean;
}
export interface StepFocusProps {
  ctx: Content;
  frame: string;
  mode: SVGModes;
  inPlace: boolean;
}
export interface StepTextProps {
  ctx: Content;
  frame?: string;
}
export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[]
) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;

export const getReasonFn =
  (reasonMap: Map<string, Reason>) => (activeFrame: string) => {
    return reasonMap.get(activeFrame) || { title: "", body: "" };
  };

export class StepCls {
  unfocused = (props: StepUnfocusProps) => {};
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused({ ctx, frame, inPlace });
    this.additions({ ctx, frame, mode: SVGModes.Focused, inPlace });
  };
  text(props: StepTextProps): JSX.Element {
    return <></>;
  }
  ticklessText?(ctx: Content): JSX.Element {
    return <></>;
  }
  staticText = () => <></>;
  additions = (props: StepFocusProps) => {};
}

export class BaseStep extends StepCls {
  ticklessText = (ctx: Content): JSX.Element => <></>;
}
