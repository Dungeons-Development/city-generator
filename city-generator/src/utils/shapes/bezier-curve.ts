import { CubicBezierCurve, Vector2, ShapeUtils, Shape, ShapeGeometry, MeshBasicMaterial, Mesh } from 'three';
import { getRandomNumber, pythagoreanTheorem, getRandomInt } from '../math';

const CURVE_LENGTH = 5;
const MIN_WATER_PERCENT = 0;
const MAX_WATER_PERCENT = 1;
const DISPLACEMENT_AMOUNT = CURVE_LENGTH / 2;
const POINT_DENSITY = 100;

export const getWaterFrontMesh = (radius: number, waterPath?: Vector2[]) => {
  if (waterPath && !validateWaterArea(waterPath, radius)) {
    throw new Error('Path of water must be larger than what is given.');
  }
  if (!waterPath) {
    waterPath = getWaterPath(radius);
  }
  const points = getPointsFromPath(waterPath, radius); 
  //const points = getPointsFromBezierCurves(bezierCurves);
  return createWaterMeshFromPoints(points, 0x0033BA);
};

const createWaterMeshFromPoints = (points: Vector2[], color: string | number ) => {
    const waterShape = new Shape(points);
    const geometry = new ShapeGeometry(waterShape);
    const material = new MeshBasicMaterial({ color });
    return new Mesh(geometry, material);
};

const getPointsFromPath = (waterPath: Vector2[], radius: number) => {
  let startPoint = waterPath[0];
  const points = [startPoint];
  for(let i = 1; i < waterPath.length; i++) {
    const currentPoint = waterPath[i];
    // Don't add a curve to points traveling along map border
    if (
      (startPoint.x === currentPoint.x && radius === Math.abs(startPoint.x)) ||
      (startPoint.y === currentPoint.y && radius === Math.abs(currentPoint.y))
    ) {
      points.push(currentPoint);
      startPoint = currentPoint;
      continue;
    }

    let distBetweenPoints = pythagoreanTheorem(startPoint, currentPoint);
    while(distBetweenPoints > CURVE_LENGTH) {
      const nextPoint = getNextPoint(startPoint, currentPoint, distBetweenPoints);
      const midPoint1 = getMidPoint(startPoint, nextPoint);
      const midPoint2 = getMidPoint(midPoint1, nextPoint);
      const bezierCurve = new CubicBezierCurve(
          startPoint,
          midPoint1,
          midPoint2,
          nextPoint,
      );
      points.push(...bezierCurve.getPoints(POINT_DENSITY));

      startPoint = nextPoint;
      distBetweenPoints = pythagoreanTheorem(startPoint, currentPoint);
    }
    points.push(currentPoint);
    startPoint = currentPoint;
  }
  return points;
};

const getNextPoint = (startPoint: Vector2, endPoint: Vector2, distanceBetween: number) => {
  const distanceRatio = CURVE_LENGTH / distanceBetween;

  const newX = (1 - distanceRatio) * startPoint.x + distanceRatio * endPoint.x;
  const newY = (1 - distanceRatio) * startPoint.y + distanceRatio * endPoint.y;

  // Randomly Offset the Position of the next point
  const xDisplacement = getRandomNumber(-DISPLACEMENT_AMOUNT, DISPLACEMENT_AMOUNT);
  const yDisplacement = getRandomNumber(-DISPLACEMENT_AMOUNT, DISPLACEMENT_AMOUNT)

  return new Vector2(newX + xDisplacement, newY + yDisplacement);
};

const getMidPoint = (startPoint: Vector2, endPoint: Vector2) => {
  const xDiff = endPoint.x - startPoint.x;
  const yDiff = endPoint.y - startPoint.y;
  
  const displacementX = xDiff < 0 ? getRandomNumber(xDiff, 0) : getRandomNumber(0, xDiff);
  const displacementY = yDiff < 0 ? getRandomNumber(yDiff, 0) : getRandomNumber(0, yDiff);

  return new Vector2(startPoint.x + displacementX, startPoint.y + displacementY);
};

const getWaterPath = (radius: number) => {
  let startPoint = generatePointInSquare(radius);
  let endPoint = generatePointInSquare(radius);
  let waterPath = getWaterFrontPath(startPoint, endPoint, radius);
  while(!validateWaterArea(waterPath, radius)) {
    startPoint = generatePointInSquare(radius);
    endPoint = generatePointInSquare(radius);
    waterPath = getWaterFrontPath(startPoint, endPoint, radius);
  }
  return waterPath;
};

const getWaterFrontPath = (startPoint: Vector2, endPoint: Vector2, radius: number) => {
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
          ...points,
          new Vector2(-radius, -radius),
          new Vector2(-radius, radius),
        ];
      }
      // Right-half
      return [
        ...points,
        new Vector2(radius, radius),
        new Vector2(radius, -radius),
      ];
    }
    if (xDiff < 0) {
      // Top-half
      return [
        ...points,
        new Vector2(-radius, radius),
        new Vector2(radius, radius),
      ];
    }
    // Bottom-half
    return [
      ...points,
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

const generatePointInSquare = (radius: number) => {
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
  return new Vector2(x, y);
};

const validateWaterArea = (waterPath: Vector2[], radius: number) => {
  const waterArea = Math.abs(ShapeUtils.area(waterPath));
  const totalArea = radius * radius * 4;
  return !(waterArea < totalArea * MIN_WATER_PERCENT || waterArea > totalArea * MAX_WATER_PERCENT)
};
