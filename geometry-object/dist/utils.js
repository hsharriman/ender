import { Obj } from "./types/types";
export var getId = function (objectType, label, tickNumber) {
    if (objectType === Obj.Angle || objectType === Obj.EqualAngleTick) {
        var endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
        label = "".concat(label[1], "-").concat(endPts);
    }
    else {
        label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    var id = "".concat(objectType, ".").concat(label);
    return tickNumber ? "".concat(id, ".").concat(tickNumber) : id;
};
// https://stackoverflow.com/questions/9960908/permutations-in-javascript
export var permutator = function (inputArr) {
    var result = [];
    var permute = function (arr, m) {
        if (m === void 0) { m = ""; }
        if (arr.length === 0) {
            result.push(m);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                var curr = arr.slice(); // copy arr
                var next = curr.splice(i, 1);
                permute(curr.slice(), m + next);
            }
        }
    };
    permute(inputArr);
    return result;
};
//# sourceMappingURL=utils.js.map