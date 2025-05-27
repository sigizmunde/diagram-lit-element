import {Point} from '../types';

/**
 * Convert a straight line segment into a cubic Bézier curve with control points on the line.
 * @param p0 Start point
 * @param p1 End point
 * @returns Cubic Bézier segment: [p0, cp1, cp2, p1]
 */
export function lineToBezier(
  p0: Point,
  p1: Point
): [Point, Point, Point, Point] {
  const cp1: Point = {
    x: p0.x + (p1.x - p0.x) / 3,
    y: p0.y + (p1.y - p0.y) / 3,
  };
  const cp2: Point = {
    x: p0.x + (2 * (p1.x - p0.x)) / 3,
    y: p0.y + (2 * (p1.y - p0.y)) / 3,
  };

  return [p0, cp1, cp2, p1];
}
