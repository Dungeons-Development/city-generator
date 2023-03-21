import * as THREE from 'three';
import { Node } from '../classes/node';
import { BoundingRadians } from '../types/input';

const MAX_CURVE_LENGTH = 10;

export const getBezierCurves = (radius: number, bounds?: BoundingRadians) => {
  if (!bounds) {
      bounds = getRandomBounds();
  }
  let startNode = new Node(radiansToX(bounds.start, radius), radiansToY(bounds.start, radius));
  const endNode = new Node(radiansToX(bounds.end, radius), radiansToY(bounds.end, radius));
  const slope = getSlope(startNode, endNode);


  let distBetweenPoints = pythagoreanTheorem(startNode, endNode);
  const bezierCurves = [];
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

  console.log(`Node locations; startNode: ${startNode.toString()}, endNode: ${endNode.toString()}`);
  return bezierCurves;
};

const getRandomBounds = (): BoundingRadians => {
  const startDegree = getRandomNumber(0, 270);
  const endDegree = getRandomNumber(startDegree, 360);
  console.log(`Random degrees; startDegree: ${startDegree}, endDegree: ${endDegree}`);

  return {
    start: degreeToRadians(startDegree),
    end: degreeToRadians(endDegree),
  };
};

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
