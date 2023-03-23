import * as THREE from 'three';
import {QuadraticBezierCurve, Vector2} from 'three';
import { Node } from '../../classes/node';
import { getRandomNumber, radiansToX, radiansToY, getSlope, pythagoreanTheorem, getRandomInt } from '../math';

const MAX_CURVE_LENGTH = 10;

export const getWaterFrontShape = (radius: number, waterPath?: THREE.Vector2[]) => {
  if (!waterPath) {
    const { startNode, endNode } = getRandomBounds(radius);
  }

};

const getCurvesToPoint = (startNode: Node, endNode: Node) => {
  const bezierCurves = [];
  const slope = getSlope(startNode, endNode);
  let distBetweenPoints = pythagoreanTheorem(startNode, endNode);

  while(distBetweenPoints > MAX_CURVE_LENGTH) {
    const nextNode = getNextNode(startNode, endNode, distBetweenPoints);
    const midPoint = getMidPoint(startNode, nextNode);
    bezierCurves.push(
      new THREE.QuadraticBezierCurve(
        new THREE.Vector2(startNode.getPosition().x, startNode.getPosition().y),
        new THREE.Vector2(midPoint.getPosition().x, midPoint.getPosition().y),
        new THREE.Vector2(nextNode.getPosition().x, nextNode.getPosition().y),
      )
    );

    startNode = nextNode;
    distBetweenPoints = pythagoreanTheorem(startNode, endNode);
  }
  return bezierCurves;
};

const getNextNode = (startNode: Node, endNode: Node, distanceBetween) => {
  const distanceRatio = MAX_CURVE_LENGTH/distanceBetween;

  const newX = (1 - distanceRatio) * startNode.getPosition().x + distanceRatio * endNode.getPosition().x;
  const newY = (1 - distanceRatio) * startNode.getPosition().y + distanceRatio * endNode.getPosition().y;

  // Randomly Offset the Position of the next point
  const displacementAmount = MAX_CURVE_LENGTH / 5;
  const xDisplacement = getRandomNumber(-displacementAmount, displacementAmount);
  const yDisplacement = getRandomNumber(-displacementAmount, displacementAmount)

  return new Node(newX + xDisplacement, newY + yDisplacement);
};

const getMidPoint = (startNode: Node, endNode: Node) => {
  const distX = endNode.getPosition().x - startNode.getPosition().x;
  const distY = endNode.getPosition().y - startNode.getPosition().y;
  
  const displacementX = distX < 0 ? getRandomNumber(distX, 0) : getRandomNumber(0, distX);
  const displacementY = distY < 0 ? getRandomNumber(distY, 0) : getRandomNumber(0, distY);

  return new Node(startNode.getPosition().x + displacementX, startNode.getPosition().y + displacementY);
};

const getRandomBounds = (radius: number): { startNode: THREE.Vector2, endNode: THREE.Vector2 } => {
  let startPoint = generateStartPoint(radius);
  let endPoint = generateStartPoint(radius);
  while(!verifyInitialPoints(startPoint, endPoint, radius)) {
    startPoint = generateStartPoint(radius);
    endPoint = generateStartPoint(radius);
  }
  return {
    startPoint,
    endPoint,
  };
};

const vectorToString = (vector: THREE.Vector2): string => `{ x: ${vector.x}, y: ${vector.y} }`;

const verifyInitialPoints = (startPoint: THREE.Vector2, endPoint: THREE.Vector2, radius: number) => {
  console.log(`startPoint: ${vectorToString(startPoint)} endPoint: ${vectorToString(endPoint)}`);
  const waterArea = getWaterFrontArea(startPoint, endPoint, radius);
  console.log(`waterArea: ${waterArea}, totalArea: ${radius * radius}`);
  const totalArea = radius * radius;
  return !(waterArea < totalArea * .15 || waterArea > totalArea * .75)
};

const getWaterFrontArea = (startPoint: THREE.Vector2, endPoint: THREE.Vector2, radius: number) => {
  const xDiff = endPoint.x - startPoint.x;
  const yDiff = endPoint.y - startPoint.y;
  // Points are on the same side TODO: Support points on same side
  if (yDiff === 0 || xDiff === 0) {
    return 0;
  }
  const points = [startPoint, endPoint];
  // Points are on opposite sides
  if (Math.abs(yDiff) === radius * 2 || Math.abs(xDiff) === radius * 2) {
    // Points are on bottom and top of map
    if (Math.abs(yDiff) === radius * 2) {
      if (yDiff < 0) {
        // Left-half
        return getArea([
          ...points,
          new THREE.Vector2(-radius, -radius),
          new THREE.Vector2(-radius, radius),
          startPoint,
        ]);
      }
      // Right-half
      return getArea([
        ...points,
        new THREE.Vector2(radius, radius),
        new THREE.Vector2(radius, -radius),
        startPoint,
      ]);
    }
    if (xDiff < 0) {
      // Top-half
      return getArea([
        ...points,
        new THREE.Vector2(-radius, radius),
        new THREE.Vector2(radius, radius),
        startPoint,
      ]);
    }
    // Bottom-half
    return getArea([
      ...points,
      new THREE.Vector2(radius, -radius),
      new THREE.Vector2(-radius, -radius),
      startPoint,
    ]);
  }

  let cornerPoint;
  if (endPoint.y === -radius) {
    // Top-left Corner
    points.push(new Vector2(-radius, -radius));
    if (startPoint.x === radius) {
      points.push(
        new Vector2(-radius, radius),
        new Vector2(radius, radius),
      );
    }
  }
  if (endPoint.x === -radius) {
    points.push(new Vector2(-radius, radius));
    if (startPoint.y === -radius) {
      points.push(
        new Vector2(radius, radius),
        new Vector2(radius, -radius),
      );
    }
  }
  if (endPoint.y === radius) {
    points.push(new Vector2(radius, radius));
    if (startPoint.x === -radius) {
      points.push(
        new Vector2(radius, -radius),
        new Vector2(-radius, -radius),
      );
    }
  }
  if (endPoint.x === radius) {
    points.push(new Vector2(radius, -radius));
    if (startPoint.y === radius) {
      points.push(
        new Vector2(-radius, -radius),
        new Vector2(-radius, radius),
      );
    }
  }

  points.push(startPoint);
  return getArea(points);
};

const generateStartPoint = (radius: number) => {
  const randomSide = getRandomInt(0, 4);
  let x, y;
  switch(randomSide) {
    case 0: // Right
      x = radius;
      y = getRandomNumber(-radius, radius);
      break;
    case 1: // Bottom
      x = getRandomNumber(-radius, radius);
      y = -radius;
      break;
    case 2: // Left
      x = -radius;
      y = getRandomNumber(-radius, radius);
      break;
    case 3: // Top
      x = getRandomNumber(-radius, radius);
      y = radius;
      break;
    default:
      throw new Error('How da heck did you get that?!!');
  }
  return new THREE.Vector2(x, y);
};

const getArea = (points: THREE.Vector2[]) => {
  return Math.abs(THREE.ShapeUtils.area(points));
};
