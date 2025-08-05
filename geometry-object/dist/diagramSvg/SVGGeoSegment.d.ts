import React from "react";
import { LSegment, TickType } from "../types/types";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
export type SVGSegmentProps = {
    s: LSegment;
    tick?: {
        type: TickType;
        num: number;
    };
} & BaseSVGProps;
export declare class SVGGeoSegment extends React.Component<SVGSegmentProps, BaseSVGState> {
    constructor(props: SVGSegmentProps);
    onHoverLabelClick: (isActive: boolean) => void;
}
//# sourceMappingURL=SVGGeoSegment.d.ts.map