import React from "react";
import { LAngle, LSegment, TickType, Vector } from "../types/types";
export type SVGTickProps = {
    parent: LSegment | LAngle;
    tick?: {
        type: TickType;
        num: number;
    };
    css: string;
    miniScale: boolean;
    isHighlight: boolean;
    geoId: string;
};
export declare class SVGGeoTick extends React.Component<SVGTickProps> {
    parallelMark: (s: LSegment, num: number) => string;
    equalLength: (s: LSegment, num: number) => string;
    equalAngle: (a: LAngle, num: number) => string;
    rightAngle: (a: LAngle) => string;
    protected tickPlacement: (unit: Vector, numTicks: number, miniScale: boolean) => Vector[];
    render(): import("react/jsx-runtime").JSX.Element;
}
//# sourceMappingURL=SVGGeoTick.d.ts.map