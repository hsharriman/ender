import { Obj } from "./types/types";
export const getId = (objectType, label, tickNumber) => {
    if (objectType === Obj.Angle || objectType === Obj.EqualAngleTick) {
        const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
        label = `${label[1]}-${endPts}`;
    }
    else {
        label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
};
// https://stackoverflow.com/questions/9960908/permutations-in-javascript
export const permutator = (inputArr) => {
    let result = [];
    const permute = (arr, m = "") => {
        if (arr.length === 0) {
            result.push(m);
        }
        else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice(); // copy arr
                let next = curr.splice(i, 1);
                permute(curr.slice(), m + next);
            }
        }
    };
    permute(inputArr);
    return result;
};
//# sourceMappingURL=utils.js.map