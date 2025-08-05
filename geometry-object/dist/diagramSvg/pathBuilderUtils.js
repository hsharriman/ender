const moveTo = (v) => {
    return `M ${v[0]} ${v[1]}`;
};
const lineTo = (v) => {
    return `L ${v[0]} ${v[1]}`;
};
const curveTo = (v1, v2, v3) => {
    return `C ${v1[0]} ${v1[1]}, ${v2[0]} ${v2[1]}, ${v3[0]} ${v3[1]}`;
};
const closePath = () => {
    return `Z`;
};
const arcTo = (r, major, sweep, end) => {
    return `A ${r} ${r} 0 ${major} ${sweep} ${end[0]} ${end[1]}`;
};
export const pops = {
    moveTo,
    lineTo,
    curveTo,
    closePath,
    arcTo,
};
//# sourceMappingURL=pathBuilderUtils.js.map