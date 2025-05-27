import {Point} from '../types';

type Arc = {
  px: number;
  py: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  xAxisRotation: number;
  largeArcFlag: boolean;
  sweepFlag: boolean;
};

type CubicSegment = [Point, Point, Point, Point]; // P0, P1, P2, P3

/**
 * Converts a single elliptical arc into cubic Bézier segments
 */
export function arcToCubicBeziers(arc: Arc): CubicSegment[] {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const {px, py, cx, cy, rx, ry, xAxisRotation, largeArcFlag, sweepFlag} = arc;

  const sinPhi = Math.sin(toRadians(xAxisRotation));
  const cosPhi = Math.cos(toRadians(xAxisRotation));

  const dx = (px - cx) / 2;
  const dy = (py - cy) / 2;

  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const x1p2 = x1p * x1p;
  const y1p2 = y1p * y1p;

  // Ensure radii are large enough
  const lambda = x1p2 / rx2 + y1p2 / ry2;
  if (lambda > 1) {
    const factor = Math.sqrt(lambda);
    rx2 = (rx * factor) ** 2;
    ry2 = (ry * factor) ** 2;
  }

  const sign = largeArcFlag !== sweepFlag ? 1 : -1;
  const coef =
    sign *
    Math.sqrt(
      Math.max(
        0,
        (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2)
      )
    );

  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;

  const cxCenter = cosPhi * cxp - sinPhi * cyp + (px + cx) / 2;
  const cyCenter = sinPhi * cxp + cosPhi * cyp + (py + cy) / 2;

  const startAngle = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
  let deltaAngle =
    Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - startAngle;

  if (!sweepFlag && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  if (sweepFlag && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  const maxSegmentAngle = Math.PI / 12;
  const segments = Math.ceil(Math.abs(deltaAngle / maxSegmentAngle));
  const delta = deltaAngle / segments;
  const beziers: CubicSegment[] = [];

  for (let i = 0; i < segments; i++) {
    const theta1 = startAngle + i * delta;
    const theta2 = theta1 + delta;

    const t = (4 / 3) * Math.tan((theta2 - theta1) / 4);

    const cosTheta1 = Math.cos(theta1);
    const sinTheta1 = Math.sin(theta1);
    const cosTheta2 = Math.cos(theta2);
    const sinTheta2 = Math.sin(theta2);

    const p0 = {
      x: cxCenter + rx * cosTheta1 * cosPhi - ry * sinTheta1 * sinPhi,
      y: cyCenter + rx * cosTheta1 * sinPhi + ry * sinTheta1 * cosPhi,
    };
    const p3 = {
      x: cxCenter + rx * cosTheta2 * cosPhi - ry * sinTheta2 * sinPhi,
      y: cyCenter + rx * cosTheta2 * sinPhi + ry * sinTheta2 * cosPhi,
    };

    const p1 = {
      x: p0.x - t * (rx * sinTheta1 * cosPhi + ry * cosTheta1 * sinPhi),
      y: p0.y - t * (rx * sinTheta1 * sinPhi - ry * cosTheta1 * cosPhi),
    };
    const p2 = {
      x: p3.x + t * (rx * sinTheta2 * cosPhi + ry * cosTheta2 * sinPhi),
      y: p3.y + t * (rx * sinTheta2 * sinPhi - ry * cosTheta2 * cosPhi),
    };

    beziers.push([p0, p1, p2, p3]);
  }

  return beziers;
}
