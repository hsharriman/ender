import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export class HoverTextLabel extends React.Component {
    constructor() {
        super(...arguments);
        this.defaultCSS = "font-serif ease-in-out duration-300 fill-violet-500 text-violet-500 select-none text-xs tracking-wide";
        this.getClassName = () => {
            if (this.props.isHovered || this.props.isPinned) {
                return (this.defaultCSS +
                    " opacity-100 cursor-pointer pointer-events-auto cursor-default");
            }
            else {
                return this.defaultCSS + " opacity-0 pointer-events-auto cursor-default";
            }
        };
    }
    render() {
        return (_jsx("text", { textAnchor: "middle", transform: `translate(${this.props.pt[0]},${this.props.pt[1]}) rotate(${this.props.rot})`, className: this.getClassName(), children: this.props.text }, this.props.text + "-label"));
    }
}
//# sourceMappingURL=HoverTextLabel.js.map