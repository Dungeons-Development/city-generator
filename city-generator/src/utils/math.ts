import { Vector2 } from 'three';

export const pythagoreanTheorem = (p1: Vector2, p2: Vector2) => {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
};

export const getSlope = (origin: Vector2, target: Vector2) => {
  const x1 = origin.x;
  const y1 = origin.y;
  const x2 = target.x;
  const y2 = target.y;
  return (y2 - y1)/(x2 - x1);
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export interface WeightMap {
  [key:number]: number;
}
export const getWeightedNumber = (weightMap: WeightMap): number => {
  const keys: number[] = [];
  for (const key in weightMap) {
    const numberOfOccurences = weightMap[key];
    if (numberOfOccurences === undefined) throw new Error('Error parsing weight map keys');
    for (let i = 0; i < numberOfOccurences; i++) {
      keys.push(parseInt(key));
    }
  }
  const weightedNumber = keys[Math.floor(Math.random() * keys.length)];
  if (weightedNumber === undefined) throw new Error('Error choosing weighted number');
  return weightedNumber;
};

/**
 * Inclusively generates a random integer
*/
export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const degreeToRadians = (degree: number) => {
  return degree * Math.PI / 180;
};

export const radiansToX = (radians: number, radius: number) => {
  return radius * Math.cos(radians);
};

export const radiansToY = (radians: number, radius: number) => {
  return radius * Math.sin(radians);
};

export const radiansToDegrees = (radians: number) => {
  const degrees = parseFloat((radians * (180 / Math.PI)).toFixed(2));
  return degrees > 0 ? degrees : 360 + degrees;
};
