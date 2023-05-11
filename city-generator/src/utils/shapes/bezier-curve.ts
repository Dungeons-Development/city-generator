import { Vector2, Curve, Shape, ShapeGeometry, MeshBasicMaterial, Mesh, CurvePath, LineCurve } from 'three';
import { getRandomNumber, pythagoreanTheorem, getRandomInt, getWeightedNumber, WeightMap, radiansToDegrees } from '../math';

const RADIUS_LIMIT_DIVISOR = 5;
const LINE_RESOLUTION = 1000;
const TOTAL_DEGREES = 360;
const DEGREE_RESOLUTION = 4;
const DEGREE_BUFFER = 5;
const MIN_WATERFRONT_LENGTH_RATIO = 1.5;
const WEIGHT_MAP = {
  PREVIOUS_POINT: 1,
  OUTSIDE_CLAMP: 0,
  CENTER: 3,
  CENTER_AFTER_BAN: 0,
  BORDER: 1,
  BORDER_AFTER_SEEK: 6,
  DEFAULT: 3,
};
const LINE_DISTANCE_MIN = 2;
const LINE_DISTANCE_MAX = 5;
const ALLOWED_LINE_DEGREE_CHANGE = 60;
const BAN_CENTER_MOVEMENT_AT_RATIO = 0.8;
const SEEK_BORDER_AT_RATIO = 1.25;

/**
 * Generates a mesh from a given waterline
 * @param waterline the curved path of the waterline
 * @param radius half of the width of the square
 */
export const generateWaterfrontMesh = (waterline: CurvePath<Vector2>, radius: number) => {
  const waterBody = generateWaterBodyPath(waterline, radius);
  return createWaterMeshFromWaterLine(waterBody, 0x0033BA, radius);
};

/**
 * Generates the rest of the water body along the borders of the square
 * @param waterline the curved path of the waterline
 * @param radius half of the width of the square
 */
const generateWaterBodyPath = (waterline: CurvePath<Vector2>, radius: number) => {
  const lineCurves = getRemaingWaterPathLines(waterline, radius);
  lineCurves.forEach((curve) => waterline.add(curve));
  return waterline;
};

/**
 * Creates a mesh from the points outlining a given shape
 * @param waterline the curved path of the waterline
 * @param color the color of the created mesh
 * @param radius half of the width of the square
 */
const createWaterMeshFromWaterLine = (waterline: CurvePath<Vector2>, color: string | number, radius: number) => {
    const points = waterline.getSpacedPoints(LINE_RESOLUTION * radius);
    const waterShape = new Shape(points);
    const geometry = new ShapeGeometry(waterShape);
    const material = new MeshBasicMaterial({ color });
    return new Mesh(geometry, material);
};

/**
 * Generates the waterline of the map
 * @param radius half of the width of the square
 * @param The CurvePath representation of the map's waterline
 */
export const generateWaterLine = (radius: number) => {
    const startPoint = generatePointOnBorderOfSquare(radius);
    return generateWaterfrontPath(startPoint, radius);
};

/**
 * Returns a randomly generated waterfront path within the radius of a square
 * @param startPoint the inital starting location from where the waterline will form
 * @param radius half of the width of the square
 */
const generateWaterfrontPath = (startPoint: Vector2, radius: number) => {
  const waterline = new CurvePath<Vector2>();
  let lengthOfLine = 0;
  let nextLine = generateNextLineInPath(startPoint, waterline, radius, lengthOfLine);
  while (!isLineOutsideSquare(nextLine, radius)) {
    waterline.add(nextLine);
    lengthOfLine += pythagoreanTheorem(nextLine.v1, nextLine.v2);

    nextLine = generateNextLineInPath(nextLine.v2, waterline, radius, lengthOfLine);
  }
  nextLine = boundLineToRadius(nextLine, radius);
  waterline.add(nextLine);
  return waterline;
};

/**
 * Returns the given line bounded to the provided radius
 * @param line the line in which to bound to the provided radius
 * @param radius half of the width of the square
 */
const boundLineToRadius = (line: LineCurve, radius: number) => {
  const { v1, v2 } = line;
  const boundedEndpoint = new Vector2(
    boundNumByRadius(v2.x, radius),
    boundNumByRadius(v2.y, radius),
  );
  return new LineCurve(v1, boundedEndpoint);
};

/**
 * Limits a given number with the bounds of a provided radius
 * @param num the number to limit by the radius
 * @param radius half of the width of the square
 */
const boundNumByRadius = (num: number, radius: number) => num > 0 ? Math.min(num, radius) : Math.max(num, -radius);
  
/**
 * Checks wether the line leaves the radius of the square
 * @param line the line segment to check
 * @param radius half of the width of the square
 */
const isLineOutsideSquare = (line: LineCurve, radius: number) => {
  const endPoint = line.v2;
  return Math.abs(endPoint.x) > radius || Math.abs(endPoint.y) > radius
}

/**
 * Generates the next line along the path using weighted randomness
 * @param startPoint the point from which the next line will start at
 * @param curvedPath the current curvedPath
 * @param radius half of the width of the square
 * @param lineLength the length of the current waterline
 */
const generateNextLineInPath = (startPoint: Vector2, curvedPath: CurvePath<Vector2>, radius: number, lineLength: number) => {
  const previousCurve = curvedPath.curves.at(-1);
  let degreeToPreviousPoint, degreeOfContinuedSlope;
  if (previousCurve) {
    degreeToPreviousPoint = getDegreeFromPoint(startPoint, previousCurve.getPoint(1));
    degreeOfContinuedSlope = (180 + degreeToPreviousPoint) % 360;
  }
  const degreeToCenter = getDegreeFromPoint(startPoint, new Vector2(0, 0));
  const degreeToClosestBorder = getDegreeFromPoint(
    startPoint,
    getClosestBorder(startPoint, radius)
  );
  const weightMap = {} as WeightMap;
  for(let scaledDegree = 0; scaledDegree < TOTAL_DEGREES / DEGREE_RESOLUTION; scaledDegree++) {
    const degree = scaledDegree * DEGREE_RESOLUTION;
    if (degreeOfContinuedSlope && Math.abs(degreeOfContinuedSlope - degree) > ALLOWED_LINE_DEGREE_CHANGE) {
      weightMap[degree] = 0;
    } else if (degreeToPreviousPoint && isDegreeWithinBuffer(degree, degreeToPreviousPoint)) {
      const isPointingAtPrevious = degree === degreeToPreviousPoint;
      weightMap[degree] = isPointingAtPrevious ? 0 : WEIGHT_MAP.PREVIOUS_POINT;
    } else if (isDegreeWithinBuffer(degree, degreeToCenter)) {
      const distanceToCenter = pythagoreanTheorem(startPoint, new Vector2(0, 0));
      const percentToCenter = distanceToCenter / radius;
      const isBan = percentToCenter > BAN_CENTER_MOVEMENT_AT_RATIO;
      weightMap[degree] = isBan ? WEIGHT_MAP.CENTER_AFTER_BAN : WEIGHT_MAP.CENTER;
    } else if (isDegreeWithinBuffer(degree, degreeToClosestBorder)) {
      const lengthRadiusRatio = lineLength / radius;
      const seekBorder = lengthRadiusRatio > SEEK_BORDER_AT_RATIO;
      weightMap[degree] = seekBorder ? WEIGHT_MAP.BORDER_AFTER_SEEK : WEIGHT_MAP.BORDER;
    } else {
      weightMap[degree] = WEIGHT_MAP.DEFAULT;
    }
  }
  return _generateNextLineInPath(startPoint, radius, weightMap, lineLength, curvedPath);
};

/**
 * A recursive function for generating the next valid point along the line
 * @param startPoint the point the line will originate from
 * @param radius half of the width of the square
 * @param wieghtMap a weighted map of the degrees of the next possible point and their likelyhood
 * @param lineLength the length of the curvedpath
 * @param curvedPath the current path of the line
 */
const _generateNextLineInPath = (
  startPoint: Vector2,
  radius: number,
  weightMap: WeightMap,
  lineLength: number,
  curvedPath: CurvePath<Vector2>,
): LineCurve => {
  const degreeOfNextPoint = getWeightedNumber(weightMap);
  const randomDistance = getRandomNumber(LINE_DISTANCE_MIN, LINE_DISTANCE_MAX);
  const endPoint = getPointFromDegree(startPoint, randomDistance, degreeOfNextPoint);
  const nextLine = new LineCurve(startPoint, endPoint);
  // New line will always start along the previous curve
  const curvesToCheck = curvedPath.curves.slice(0, -1);

  const collideWithWaterline = doesLineCollideWithCurves(nextLine, curvesToCheck);
  const isLineLongEnough = (lineLength + randomDistance) / radius > MIN_WATERFRONT_LENGTH_RATIO;
  if ((!isLineOutsideSquare(nextLine, radius) || isLineLongEnough) && !collideWithWaterline) {
    return nextLine;
  }
  return _generateNextLineInPath(startPoint, radius, weightMap, lineLength, curvedPath);
};

/**
 * Returns a boolean based on wether the given line intersects with the provided curves
 * @param line the line segment to check
 * @param curves the curves the provided line cannot intersect with
 */
const doesLineCollideWithCurves = (line: LineCurve, curves: Curve<Vector2>[]): boolean => {
  return !!curves.find((curve) => doLinesIntersect(line.v1, line.v2, curve.getPoint(0), curve.getPoint(1)));
};

const doLinesIntersect = (p1: Vector2, q1: Vector2, p2: Vector2, q2: Vector2): boolean => {
  const o1 = getOrientationOfTriplet(p1, q1, p2);
  const o2 = getOrientationOfTriplet(p1, q1, q2);
  const o3 = getOrientationOfTriplet(p2, q2, p1);
  const o4 = getOrientationOfTriplet(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  
  // Line Segments are Collinear
  const p2LiesOnSegment = o1 === 0 && isPointOnSegment(p1, q1, p2);
  const q2LiesOnSegment = o2 === 0 && isPointOnSegment(p1, q1, q2);
  const p1LiesOnSegment = o3 === 0 && isPointOnSegment(p2, q2, p1);
  const q1LiesOnSegment = o4 === 0 && isPointOnSegment(p2, q2, q1);

  return p2LiesOnSegment || q2LiesOnSegment || p1LiesOnSegment || q1LiesOnSegment;
};

const isPointOnSegment = (p: Vector2, q: Vector2, point: Vector2) => {
  const liestBetweenX = Math.min(p.x, q.x) <= point.x && Math.max(p.x, q.x) >= point.x;
  const liestBetweenY = Math.min(p.y, q.y) <= point.y && Math.max(p.y, q.y) >= point.y;
  return liestBetweenX && liestBetweenY;
};

enum ORIENTATION {
  'COLLINEAR',
  'CLOCKWISE',
  'COUNTER_CLOCKWISE',
}
/**
* @description Return 0 for collinear, negative for counterClockwise, positive for clockwise
*/
const getOrientationOfTriplet = (p1: Vector2, p2: Vector2, p3: Vector2) => {
  const orientation = ((p2.y - p1.y)*(p3.x - p2.x)) - ((p3.y - p2.y)*(p2.x - p1.x));
  if (orientation === 0) return ORIENTATION.COLLINEAR;
  return orientation < 0 ? ORIENTATION.COUNTER_CLOCKWISE : ORIENTATION.CLOCKWISE;
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

/**
 * Generates the lines needed to connect the first and last point of a line along the border of a square
 * @param waterline a curved path that begins and ends on the radius of a square
 * @param radius half of the width of the square
 */
const getRemaingWaterPathLines = (waterline: CurvePath<Vector2>, radius: number): LineCurve[] => {
  const curves = waterline.curves;
  const startCurve = curves.at(0);
  const endCurve = curves.at(-1);
  if (!startCurve || !endCurve && startCurve !== endCurve) throw new Error('Start and end curve must be defined');

  const startPoint = startCurve.getPoint(0);
  const endPoint = endCurve.getPoint(1);
  const xDiff = endPoint.x - startPoint.x;
  const yDiff = endPoint.y - startPoint.y;

  const waterEndsOnSameBorder = yDiff === 0 || xDiff === 0;
  if (waterEndsOnSameBorder) {
    return [];
  }

  const waterEndsOnOppositeBorders = Math.abs(yDiff) === radius * 2 || Math.abs(xDiff) === radius * 2;
  if (waterEndsOnOppositeBorders) {
    return getLinesConnectingOpposingBorders(startPoint, endPoint, radius);
  }

  return getLinesConnectingAdjacentBorders(startPoint, endPoint, radius);
};

/**
 * Generates the lines needed to connect two points on opposite sides in a clockwise fashion along a square's border
 * @param p1 the point in which the generated lines will end on
 * @param p2 the point the lines will start generating from
 * @param radius half of the width of the square
 */
const getLinesConnectingOpposingBorders = (p1: Vector2, p2: Vector2, radius: number) => {
  const lineCurves = [];
  const topLeftCorner = new Vector2(-radius, radius);
  const topRightCorner = new Vector2(radius, radius);
  const bottomRightCorner = new Vector2(radius, -radius);
  const bottomLeftCorner = new Vector2(-radius, -radius);
  if (p2.x === -radius) {
    lineCurves.push(
      new LineCurve(p2, topLeftCorner),
      new LineCurve(topLeftCorner, topRightCorner),
      new LineCurve(topRightCorner, p1),
    );
  }
  if (p2.x === radius) {
    lineCurves.push(
      new LineCurve(p2, bottomRightCorner),
      new LineCurve(bottomRightCorner, bottomLeftCorner),
      new LineCurve(bottomLeftCorner, p1),
    );
  }
  if (p2.y === -radius) {
    lineCurves.push(
      new LineCurve(p2, bottomLeftCorner),
      new LineCurve(bottomLeftCorner, topLeftCorner),
      new LineCurve(topLeftCorner, p1),
    );
  }
  if (p2.y === radius) {
    lineCurves.push(
      new LineCurve(p2, topRightCorner),
      new LineCurve(topRightCorner, bottomRightCorner),
      new LineCurve(bottomRightCorner, p1),
    );
  }
  return lineCurves;
}

/**
 * Generates the lines needed to connect two points on adjacent sides in a clockwise fashion along a square's border
 * @param p1 the point in which the generated lines will end on
 * @param p2 the point the lines will start generating from
 * @param radius half of the width of the square
 */
const getLinesConnectingAdjacentBorders = (p1: Vector2, p2: Vector2, radius: number) => {
  const lineCurves = [];
  const topLeftCorner = new Vector2(-radius, radius);
  const topRightCorner = new Vector2(radius, radius);
  const bottomRightCorner = new Vector2(radius, -radius);
  const bottomLeftCorner = new Vector2(-radius, -radius);
  if (p2.x === -radius) {
    lineCurves.push(new LineCurve(p2, topLeftCorner));
    if (p1.y === -radius) {
      lineCurves.push(
        new LineCurve(topLeftCorner, topRightCorner),
        new LineCurve(topRightCorner, bottomRightCorner),
      );
    }
  }
  if (p2.x === radius) {
    lineCurves.push(new LineCurve(p2, bottomRightCorner));
    if (p1.y === radius) {
      lineCurves.push(
        new LineCurve(bottomRightCorner, bottomLeftCorner),
        new LineCurve(bottomLeftCorner, topLeftCorner),
      );
    }
  }
  if (p2.y === -radius) {
    lineCurves.push(new LineCurve(p2, bottomLeftCorner));
    if (p1.x === radius) {
      lineCurves.push(
        new LineCurve(bottomLeftCorner, topLeftCorner),
        new LineCurve(topLeftCorner, topRightCorner),
      );
    }
  }
  if (p2.y === radius) {
    lineCurves.push(new LineCurve(p2, topRightCorner));
    if (p1.x === -radius) {
      lineCurves.push(
        new LineCurve(topRightCorner, bottomRightCorner),
        new LineCurve(bottomRightCorner, bottomLeftCorner),
      );
    }
  }
  return lineCurves;
};

/**
 * Generates a random point on the border of a square within the radius limit divisor
 * @param radius half of the width of the square
 */
const generatePointOnBorderOfSquare = (radius: number): Vector2 => {
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
  const chosenSide = sidesMap[randomSide];
  if (!chosenSide) throw new Error('Invalid chosen side for start point');
  return chosenSide;
};
