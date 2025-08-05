import React from "react";
import { Triangle } from "../geometry/Triangle";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
export type SVGTriangleProps = {
    t: Triangle;
    congruent: boolean;
    rotate: boolean;
} & BaseSVGProps;
export declare class SVGGeoTriangle extends React.Component<SVGTriangleProps, BaseSVGState> {
    constructor(props: SVGTriangleProps);
    onHover: (isActive: boolean) => void;
}
//# sourceMappingURL=SVGGeoTriangle.d.ts.map