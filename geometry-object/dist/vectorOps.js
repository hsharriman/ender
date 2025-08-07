export var vops = {
    // Return true if v1 === v2
    eq: function (v1, v2) { return v1[0] === v2[0] && v1[1] === v2[1]; },
    // Return the magnitude of vector v
    mag: function (v) { return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)); },
    // Return unit vector of v
    unit: function (v) { return vops.div(v, vops.mag(v)); },
    // Return true if v1 === v2
    equals: function (v1, v2) { return v1[0] === v2[0] && v1[1] === v2[1]; },
    // Return v1 + v2
    add: function (v1, v2) { return [v1[0] + v2[0], v1[1] + v2[1]]; },
    // Return v1 - v2
    sub: function (v1, v2) { return [v1[0] - v2[0], v1[1] - v2[1]]; },
    // Return vector v entrywise multiplied by scalar s
    smul: function (v, s) { return [v[0] * s, v[1] * s]; },
    // Return vector v entrywise divided by s
    div: function (v, s) { return vops.smul(v, 1 / s); },
    // Return dot product of v1 and v2
    dot: function (v1, v2) { return v1[0] * v2[0] + v1[1] * v2[1]; },
    cross: function (v1, v2) { return v1[0] * v2[1] - v1[1] * v2[0]; },
    // Rotate a 2D point [x, y] by a degrees counterclockwise.
    rot: function (_a, a) {
        var x = _a[0], y = _a[1];
        var angle = (a * Math.PI) / 180;
        var x2 = Math.cos(angle) * x - Math.sin(angle) * y;
        var y2 = Math.sin(angle) * x + Math.cos(angle) * y;
        return [x2, y2];
    },
    angleBetweenDeg: function (v1, v2) {
        return Math.acos(vops.dot(v1, v2) / (vops.mag(v1) * vops.mag(v2))) *
            (180 / Math.PI);
    },
};
//# sourceMappingURL=vectorOps.js.map