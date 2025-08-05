import React from "react";
import { Vector } from "../types/types";
export interface HoverTextLabelProps {
    pt: Vector;
    rot: number;
    text: string;
    isHovered: boolean;
    isPinned: boolean;
}
export declare class HoverTextLabel extends React.Component<HoverTextLabelProps, {}> {
    private defaultCSS;
    getClassName: () => string;
    render(): import("react/jsx-runtime").JSX.Element;
}
//# sourceMappingURL=HoverTextLabel.d.ts.map