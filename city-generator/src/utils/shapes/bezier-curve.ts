import { CubicBezierCurve, Vector2, Shape, ShapeGeometry, MeshBasicMaterial, Mesh } from 'three';
import { getRandomNumber, pythagoreanTheorem, getRandomInt, getWeightedNumber, WeightMap, radiansToDegrees } from '../math';

const CURVE_LENGTH = 5;
const POINT_RESOLUTION = 100;
const RADIUS_LIMIT_DIVISOR = 5;
const TOTAL_DEGREES = 360;
const DEGREE_RESOLUTION = 4;
const DEGREE_BUFFER = 5;
const WEIGHT_MAP = {
  PREVIOUS_POINT: 1,
  CENTER: 3,
  CENTER_AFTER_BAN: 0,
  BORDER: 1,
  BORDER_AFTER_SEEK: 5,
  DEFAULT: 3,
};
const LINE_DISTANCE_MIN = 2;
const LINE_DISTANCE_MAX = 5;
const BAN_CENTER_MOVEMENT_AT_RATIO = 0.8;
const SEEK_BORDER_AT_RATIO = 1.25;

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
  let nextPoint = generateNextRandomPoint(startPoint, radius, new Vector2(0, 0), 0);
  const rawPoints = [startPoint, nextPoint]; // TODO: KILL IT
  let lengthOfLine = 0;
  while (lengthOfLine < radius * 2) {
    waterPath.push(...getBezierPoints(startPoint, nextPoint));
    const previousPoint = startPoint;
    startPoint = nextPoint;
    lengthOfLine += pythagoreanTheorem(previousPoint, nextPoint);
    nextPoint = generateNextRandomPoint(nextPoint, radius, previousPoint, lengthOfLine);
    rawPoints.push(nextPoint);
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
  const degreeToCenter = getDegreeFromPoint(currentPoint, new Vector2(0, 0));
  const degreeToClosestBorder = getDegreeFromPoint(
    currentPoint,
    getClosestBorder(currentPoint, radius)
  );
  const weightMap = {} as WeightMap;
  for(let scaledDegree = 0; scaledDegree < TOTAL_DEGREES / DEGREE_RESOLUTION; scaledDegree++) {
    const degree = scaledDegree * DEGREE_RESOLUTION;
    if (isDegreeWithinBuffer(degree, degreeToPreviousPoint)) {
      const isPointingAtPrevious = degree === degreeToPreviousPoint;
      weightMap[degree] = isPointingAtPrevious ? 0 : WEIGHT_MAP.PREVIOUS_POINT;
    } else if (isDegreeWithinBuffer(degree, degreeToCenter)) {
      const distanceToCenter = pythagoreanTheorem(currentPoint, new Vector2(0, 0));
      const percentToCenter = distanceToCenter / radius;
      const isBan = percentToCenter > BAN_CENTER_MOVEMENT_AT_RATIO;
      weightMap[degree] = isBan ? WEIGHT_MAP.CENTER_AFTER_BAN : WEIGHT_MAP.CENTER;
    } else if (isDegreeWithinBuffer(degree, degreeToClosestBorder)) {
      const lengthRadiusRatio = totalLength / radius;
      const seekBorder = lengthRadiusRatio > SEEK_BORDER_AT_RATIO;
      weightMap[degree] = seekBorder ? WEIGHT_MAP.BORDER_AFTER_SEEK : WEIGHT_MAP.BORDER;
    } else {
      weightMap[degree] = WEIGHT_MAP.DEFAULT;
    }
  }
  const randomDistance = getRandomNumber(LINE_DISTANCE_MIN, LINE_DISTANCE_MAX);
  return _generateNextRandomPoint(currentPoint, radius, randomDistance, weightMap);
};

const _generateNextRandomPoint = (point: Vector2, radius: number, randomDistance: number, weightMap: WeightMap): Vector2 => {
  const degreeOfNextPoint = getWeightedNumber(weightMap);
  const nextPoint = getPointFromDegree(point, randomDistance, degreeOfNextPoint);
  if (Math.abs(nextPoint.x) < radius && Math.abs(nextPoint.y) < radius) {
    return nextPoint;
  }
  return _generateNextRandomPoint(point, radius, randomDistance, weightMap);
};

const isDegreeWithinBuffer = (degree: number, targetDegree: number) => {
  const isGreaterThanLowerBound = degree > targetDegree - DEGREE_BUFFER;
  const isLessThanUpperBound = degree < targetDegree + DEGREE_BUFFER;
  return isGreaterThanLowerBound && isLessThanUpperBound;
};

const getClosestBorder = (point: Vector2, radius: number) => {
  if (Math.abs(point.x) > Math.abs(point.y)) {
    return new Vector2(
      point.x > 0 ? radius : -radius,
      point.y
    );
  }
  return new Vector2(
    point.x,
    point.y > 0 ? radius : -radius,
  );
};

const getPointFromDegree = (origin: Vector2, distanceFromPoint: number, degree: number) => {
  const radians = degree * (Math.PI / 180);
  const x = origin.x + Math.sin(radians) * distanceFromPoint;
  const y = origin.y + Math.cos(radians) * distanceFromPoint;
  return new Vector2(x, y);
};

const getDegreeFromPoint = (origin: Vector2, point: Vector2) => {
  const vector2 = new Vector2(point.x - origin.x, point.y - origin.y);
  const radians = Math.atan2(vector2.y, vector2.x);
  return radiansToDegrees(radians);
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
