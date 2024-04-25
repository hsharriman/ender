import { LinkedText } from "../components/LinkedText";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { Content } from "../core/objgraph";
import { SVGModes } from "../core/types";

export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[]
) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;

export abstract class BaseStep {
  abstract text(ctx: Content, frame?: string): JSX.Element;
  static additions(
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace: boolean = true
  ): Content {
    return ctx;
  }
  abstract unfocused(ctx: Content, frame: string, inPlace: boolean): Content;
  abstract diagram(ctx: Content, frame: string, inPlace: boolean): Content;
}
