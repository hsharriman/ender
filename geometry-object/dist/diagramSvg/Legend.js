import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ModeCSS } from "./SVGStyles";
export const Legend = () => {
    const modes = [
        ["New Statement", ModeCSS.DERIVEDFILL],
        ["Relies on", ModeCSS.RELIESFILL],
        ["Inconsistency", ModeCSS.INCONSISTENTFILL],
    ];
    const renderItem = (mode, text, isLast) => (_jsxs("div", { className: "inline-flex flex-row pr-2 pb-1", children: [_jsx("div", { className: "inline-flex w-4 h-4 mr-1", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "w-full h-full", children: _jsx("rect", { width: "100%", height: "100%", x: "0", y: "0", className: mode + " stroke-[36px]" }) }) }), _jsx("div", { className: "text-sm text-black flex-nowrap", children: text })] }));
    return (_jsx("div", { className: "mt-2 flex flex-row items-center justify-center", children: _jsx("div", { className: "flex flex-row flex-wrap gap-4", children: modes.map((m, i) => {
                return renderItem(m[1], m[0], i === modes.length - 1);
            }) }) }));
};
//# sourceMappingURL=Legend.js.map