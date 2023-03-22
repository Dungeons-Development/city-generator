import { Node } from '../classes/node';

const pythagoreanTheorem = (p1: Node, p2: Node) => {
  const x1 = p1.getPosition().x;
  const y1 = p1.getPosition().y;
  const x2 = p2.getPosition().x;
  const y2 = p2.getPosition().y;
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
};

const getSlope = (p1: Node, p2: Node) => {
  const x1 = p1.getPosition().x;
  const y1 = p1.getPosition().y;
  const x2 = p2.getPosition().x;
  const y2 = p2.getPosition().y;
  return (y2 - y1)/(x2 - x1);
};

const getRandomNumber = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const degreeToRadians = (degree: number) => {
  return degree * Math.PI / 180;
};

const radiansToX = (radians: number, radius: number) => {
  return radius * Math.cos(radians);
};

const radiansToY = (radians: number, radius: number) => {
  return radius * Math.sin(radians);
};
