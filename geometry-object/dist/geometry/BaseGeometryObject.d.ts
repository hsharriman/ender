import { Obj, SVGModes } from "../types/types";
export interface BaseGeometryProps {
    activeIdx?: number;
    parentFrame?: string;
}
export declare class BaseGeometryObject {
    readonly tag: Obj;
    names: string[];
    label: string;
    protected modes: Map<string, SVGModes>;
    activeIdx: number;
    getId: (objectType: Obj, label: string, tickNumber?: number) => string;
    constructor(tag: Obj, props: BaseGeometryProps);
    getMode: (frameKey: string) => SVGModes | undefined;
    mode: (frameKey: string, mode: SVGModes) => this;
    onClickText: (isActive: boolean) => void;
    matches: (name: string) => boolean;
}
//# sourceMappingURL=BaseGeometryObject.d.ts.map