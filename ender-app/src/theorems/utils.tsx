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
  unfocused?(ctx: Content, frame: string, inPlace: boolean) {}
  diagram(ctx: Content, frame: string, inPlace: boolean) {}
  text(ctx: Content, frame?: string): JSX.Element {
    return <></>;
  }
  ticklessText?(ctx: Content): JSX.Element {
    return <></>;
  }
  additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace: boolean = true
  ) => {};
}
export class BaseStep extends StepCls {
  ticklessText = (ctx: Content): JSX.Element => <></>;
}
