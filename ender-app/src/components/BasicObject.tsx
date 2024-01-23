export interface BasicObjectProps {
  id: string;
}

export class BasicObject {
  private id: string;
  constructor(id: string) {
    this.id = id;
  }
  
  getId() {
    return this.id;
  }
}