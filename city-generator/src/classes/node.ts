export class Node {
  constructor(
    private x: number,
    private y: number
  ) {}
  getPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }
  toString() {
    return `{ x: ${this.x}, y: ${this.y}}`;
  }
}

