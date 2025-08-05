import React from "react";
import { ShowPoint } from "../geometry/Point";
import { LPoint, Vector } from "../types/types";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
export type SVGPointProps = {
    p: LPoint;
    offset: Vector;
    label: string;
    showLabel?: boolean;
    showPoint: ShowPoint;
} & BaseSVGProps;
export declare class SVGGeoPoint extends React.Component<SVGPointProps, BaseSVGState> {
    showLabel: boolean;
    constructor(props: SVGPointProps);
    onTextClick: () => void;
}
//# sourceMappingURL=SVGGeoPoint.d.ts.map