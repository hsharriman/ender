
export enum ObjectType {
  Point,
  Segment,
  Angle,
  Triangle,
}

export interface ObjectNodeProps {
  id: number;
  meta: string; //? any comments about the node i.e. the type or the name
  parent?: ObjectNode;
  children?: ObjectNode[];
}

//captures relationship between different IDs. still no relationship between IDs and the actual object
//need to be able to search by label name
export class ObjectNode {
  private id: number;
  // private meta: string;
  private parent: ObjectNode | undefined;
  private children: ObjectNode[];
  constructor(props: ObjectNodeProps) {
    this.id = props.id;
    // this.meta = props.meta;
    this.parent = props.parent;
    this.children = props.children ? props.children : [];
    // this.object = actual class for the object?
  }

  getId = () => {
    return this.id;
  }

  getChildren = () => {
    return this.children;
  }

  addChild = (child: ObjectNode) => {
    this.children?.push(child);
  }

  getParent = () => {
    return this.parent;
  }
}