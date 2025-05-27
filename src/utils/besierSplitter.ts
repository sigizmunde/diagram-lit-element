import {Point} from '../types';

/**
 * De Casteljau subdivision for a cubic Bézier curve.
 * Splits from t0 to t1 (usually [0,1] or [0,t], [t,1])
 */
function cubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const x01 = lerp(p0.x, p1.x, t);
  const y01 = lerp(p0.y, p1.y, t);
  const x12 = lerp(p1.x, p2.x, t);
  const y12 = lerp(p1.y, p2.y, t);
  const x23 = lerp(p2.x, p3.x, t);
  const y23 = lerp(p2.y, p3.y, t);

  const x012 = lerp(x01, x12, t);
  const y012 = lerp(y01, y12, t);
  const x123 = lerp(x12, x23, t);
  const y123 = lerp(y12, y23, t);

  const x = lerp(x012, x123, t);
  const y = lerp(y012, y123, t);

  return {x, y};
}

/**
 * Splits a cubic Bézier (C) into `segments` sub-curves
 */
export function splitCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  segments: number
): [Point, Point, Point, Point][] {
  const result: [Point, Point, Point, Point][] = [];

  for (let i = 1; i <= segments; i++) {
    const t0 = (i - 1) / segments;
    const t1 = i / segments;

    const pStart = cubicBezierPoint(p0, p1, p2, p3, t0);
    const pMid1 = cubicBezierPoint(p0, p1, p2, p3, t0 + (t1 - t0) / 3);
    const pMid2 = cubicBezierPoint(p0, p1, p2, p3, t0 + (2 * (t1 - t0)) / 3);
    const pEnd = cubicBezierPoint(p0, p1, p2, p3, t1);

    result.push([pStart, pMid1, pMid2, pEnd]);
  }

  return result;
}
