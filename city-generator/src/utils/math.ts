import { Vector2 } from 'three';

export const pythagoreanTheorem = (p1: Vector2, p2: Vector2) => {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
};

export const getSlope = (p1: Vector2, p2: Vector2) => {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  return (y2 - y1)/(x2 - x1);
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export const degreeToRadians = (degree: number) => {
  return degree * Math.PI / 180;
};

export const radiansToX = (radians: number, radius: number) => {
  return radius * Math.cos(radians);
};

export const radiansToY = (radians: number, radius: number) => {
  return radius * Math.sin(radians);
};
