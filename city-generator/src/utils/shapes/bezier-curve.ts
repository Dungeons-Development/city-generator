import { CubicBezierCurve, Vector2, ShapeUtils, Shape, ShapeGeometry, MeshBasicMaterial, Mesh } from 'three';
import { getRandomNumber, pythagoreanTheorem, getRandomInt } from '../math';

const CURVE_LENGTH = 5;
const POINT_RESOLUTION = 100;
const RADIUS_LIMIT_DIVISOR = 5;

export const getWaterFrontMesh = (radius: number, waterPath?: Vector2[]) => {
  if (!waterPath) {
    const startPoint = generatePointInSquare(radius);
    waterPath = generateWaterBodyPath(startPoint, radius);
  }
  return createWaterMeshFromPoints(waterPath, 0x0033BA);
};

const generateWaterBodyPath = (startPoint: Vector2, radius: number) => {
    const waterPath = generateWaterfrontPath(startPoint, radius);
    const endPoint = waterPath.at(-1);
    if (!endPoint) throw new Error('idk what happened');
    waterPath.push(...getRemaingWaterPath(startPoint, endPoint, radius));
    return waterPath;
};

const createWaterMeshFromPoints = (points: Vector2[], color: string | number ) => {
    const waterShape = new Shape(points);
    const geometry = new ShapeGeometry(waterShape);
    const material = new MeshBasicMaterial({ color });
    return new Mesh(geometry, material);
};

/**
 * @startPoint starting location of the water pathway
 * @radius half the width of the square
 */
const generateWaterfrontPath = (startPoint: Vector2, radius: number) => {
  const waterPath = [];
  let nextPoint = generateNextRandomPoint(startPoint, radius);
  while (isPointWithinSquare(nextPoint, radius)) {
    waterPath.push(...getBezierPoints(startPoint, nextPoint));
    startPoint = nextPoint;
    nextPoint = generateNextRandomPoint(nextPoint, radius);
  }

  nextPoint = boundPointToRadius(nextPoint, radius);
  waterPath.push(...getBezierPoints(startPoint, nextPoint));
  return waterPath;
};

const getBezierPoints = (startPoint: Vector2, endPoint: Vector2) => {
    return generateCubicBezierCurve(startPoint, endPoint)
      .getPoints(POINT_RESOLUTION);
}

const boundPointToRadius = (point: Vector2, radius: number) => {
  return new Vector2(
    boundNumByRadius(point.x, radius),
    boundNumByRadius(point.y, radius),
  );
};

const boundNumByRadius = (num: number, bound: number) => num > 0 ? Math.min(num, -bound) : Math.max(num, bound);

const generateCubicBezierCurve = (startPoint: Vector2, endPoint: Vector2) => {
    const midPoint1 = getRandomPointBetween(startPoint, endPoint);
    const midPoint2 = getRandomPointBetween(midPoint1, endPoint);
    return new CubicBezierCurve(
      startPoint,
      midPoint1,
      midPoint2,
      endPoint,
    );
};

const getRandomPointBetween = (startPoint: Vector2, endPoint: Vector2) => {
  const xDiff = endPoint.x - startPoint.x;
  const yDiff = endPoint.y - startPoint.y;
  
  const displacementX = xDiff < 0 ? getRandomNumber(xDiff, 0) : getRandomNumber(0, xDiff);
  const displacementY = yDiff < 0 ? getRandomNumber(yDiff, 0) : getRandomNumber(0, yDiff);

  return new Vector2(startPoint.x + displacementX, startPoint.y + displacementY);
};

  
const isPointWithinSquare = (point: Vector2, radius: number) => Math.abs(point.x) <= radius && Math.abs(point.y) <= radius

const generateNextRandomPoint = (currentPoint: Vector2, radius: number, previousPoint: Vector2, totalLength: number) => {
  const degreeToPreviousPoint = getDegreeFromPoint(currentPoint, previousPoint);
  const weightMap = generateWeightMap(

  const randDistX = getDisplacement(point.x, radius);
  const randDistY = getDisplacement(point.y, radius);

  return new Vector2(point.x + randDistX, point.y + randDistY);
};

const getDegreeFromPoint = (center: Vector2, point: Vector2) => {
  const angle = Math.atan(point.y - center.y/point.x - center.x);
  return angle * (180 / Math.PI);
};

const getDisplacement = (start: number, radius: number) => {
  const percentToBorder = Math.abs(start) / radius;
  // Grows larger the closer to the starting point is to the border

  const displacement = getRandomNumber(0, CURVE_LENGTH);
};

const getRemaingWaterPath = (startPoint: Vector2, endPoint: Vector2, radius: number) => {
  const xDiff = endPoint.x - startPoint.x;
  const yDiff = endPoint.y - startPoint.y;
  // Points are on the same side TODO: Support points on same side
  if (yDiff === 0 || xDiff === 0) {
    return [];
  }
  const points = [startPoint, endPoint];
  // Points are on opposite sides
  if (Math.abs(yDiff) === radius * 2 || Math.abs(xDiff) === radius * 2) {
    // Points are on bottom and top of map
    if (Math.abs(yDiff) === radius * 2) {
      if (yDiff < 0) {
        // Left-half
        return [
          new Vector2(-radius, -radius),
          new Vector2(-radius, radius),
        ];
      }
      // Right-half
      return [
        new Vector2(radius, radius),
        new Vector2(radius, -radius),
      ];
    }
    if (xDiff < 0) {
      // Top-half
      return [
        new Vector2(-radius, radius),
        new Vector2(radius, radius),
      ];
    }
    // Bottom-half
    return [
      new Vector2(radius, -radius),
      new Vector2(-radius, -radius),
    ];
  }

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
  return points;
};

/**
 * Generates a random point on the border of a square within the radius limit divisor
 * @param radius half of the width of the square
 */
const generatePointInSquare = (radius: number) => {
  const randomSide = getRandomInt(0, 3);
  // Bound the point to a location near one of the two corners
  const rangeFromRadius = radius / RADIUS_LIMIT_DIVISOR;
  let startingLoc = getRandomNumber(radius - rangeFromRadius, radius);

  // Select one of the two random corners
  if (randomSide % 2) {
    startingLoc *= -1;
  }
  const sidesMap = [
    new Vector2(radius, startingLoc), // Left
    new Vector2(-radius, startingLoc), // Right
    new Vector2(startingLoc, radius),  // Bottom
    new Vector2(startingLoc, -radius), // Top
  ];
  return sidesMap[randomSide];
};
