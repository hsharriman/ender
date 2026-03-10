import { Obj } from "../types/types";
export class BaseGeometryObject {
    // readonly hoverable: boolean;
    constructor(tag, props) {
        this.names = new Set();
        this.label = "";
        // https://stackoverflow.com/questions/9960908/permutations-in-javascript
        this.permutator = (inputArr) => {
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
            return new Set(result);
        };
        this.getId = (objectType, label, tickNumber) => {
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
        this.getMode = (frameKey) => this.modes.get(frameKey);
        this.mode = (frameKey, mode) => {
            this.modes.set(frameKey, mode);
            return this;
        };
        // deprecated
        this.onClickText = (isActive) => {
            // do nothing
        };
        this.isEqualTo = (other) => {
            return this.matches(other.label);
        };
        this.matches = (name) => this.names.has(name);
        this.tag = tag;
        this.modes = new Map();
        this.activeIdx = props.activeIdx ? props.activeIdx : -1;
        // this.hoverable = props.hoverable;
    }
}
//# sourceMappingURL=BaseGeometryObject.js.map