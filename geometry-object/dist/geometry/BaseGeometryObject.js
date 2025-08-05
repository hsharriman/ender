import { getId } from "../utils";
export class BaseGeometryObject {
    constructor(tag, props) {
        this.names = [];
        this.label = "";
        // readonly hoverable: boolean;
        this.getId = getId;
        this.getMode = (frameKey) => this.modes.get(frameKey);
        this.mode = (frameKey, mode) => {
            this.modes.set(frameKey, mode);
            return this;
        };
        // deprecated
        this.onClickText = (isActive) => {
            // do nothing
        };
        this.matches = (name) => this.names.find((n) => n === name) !== undefined;
        this.tag = tag;
        this.modes = new Map();
        this.activeIdx = props.activeIdx ? props.activeIdx : -1;
        // this.hoverable = props.hoverable;
    }
}
//# sourceMappingURL=BaseGeometryObject.js.map