import React from "react";
import { LAngle, TickType } from "../types/types";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
export type SVGAngleProps = {
    a: LAngle;
    tick?: {
        type: TickType;
        num: number;
    };
} & BaseSVGProps;
export declare class SVGGeoAngle extends React.Component<SVGAngleProps, BaseSVGState> {
    constructor(props: SVGAngleProps);
    onHover: (isActive: boolean) => void;
}
//# sourceMappingURL=SVGGeoAngle.d.ts.map