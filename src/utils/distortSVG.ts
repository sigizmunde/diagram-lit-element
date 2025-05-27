// Utility to distort SVG path coordinates to create a "drafty" or "sketchy" look

import {Point} from '../types';
import {arcToCubicBeziers} from './arcToBesier';
import {lineToBezier} from './lineToBesier';

/**
 * Draws a basic SVG path element into the provided SVG root.
 */
export function drawPath(
  svg: SVGSVGElement,
  d: string,
  attrs: Record<string, string> = {}
): void {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'black');

  for (const [key, val] of Object.entries(attrs)) {
    path.setAttribute(key, val);
  }

  svg.appendChild(path);
}

/**
 * Wraps a path-drawing function to add a sketchy, drafty effect.
 */
export function makeDraftyPath(
  drawPathFn: (
    svg: SVGSVGElement,
    d: string,
    attrs?: Record<string, string>
  ) => void,
  options: {
    jitter?: number;
    repeats?: number;
  } = {}
): (svg: SVGSVGElement, d: string, attrs?: Record<string, string>) => void {
  const jitter = options.jitter ?? 1.2;
  const repeats = options.repeats ?? 3;

  return function (
    svg: SVGSVGElement,
    d: string,
    attrs: Record<string, string> = {}
  ): void {
    for (let i = 0; i < repeats + 1; i++) {
      const distortedD = distortPath(d, jitter);

      // Prepare attributes for this iteration
      const isFirst = !i;

      // Copy attrs but override fill/stroke accordingly
      const attrsCopy = {...attrs};

      if (isFirst) {
        // Last (lowest) copy: fill only, no stroke
        if (attrsCopy.fill === undefined) {
          attrsCopy.fill = 'black'; // fallback fill color if none given
        }
        attrsCopy.stroke = 'none';
      } else {
        // Earlier copies: stroke only, no fill
        attrsCopy.fill = 'none';
        if (attrsCopy.stroke === undefined) {
          attrsCopy.stroke = 'black'; // fallback stroke color if none given
        }
      }

      drawPathFn(svg, distortedD, attrsCopy);
    }
  };
}

/**
 * Jitters numeric coordinates in an SVG path string.
 * Supports all basic path commands: M, L, H, V, C, S, Q, T, A, Z.
 */
function distortPath(d: string, jitter: number): string {
  const commandRegex = /([a-zA-Z])([^a-zA-Z]*)/g;

  let currentPoint: Point = {x: 0, y: 0};
  let subpathStart: Point = {x: 0, y: 0};

  // Helper: jitter coordinate
  const distortCoord = (val: number) =>
    val + (Math.random() - 0.5) * jitter * 2;

  // Helper: parse numbers from a string
  function parseParams(paramStr: string): number[] {
    return paramStr
      .trim()
      .split(/[\s,]+/)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  }

  // Accumulate rebuilt path here
  let rebuiltPath = '';

  // Iterate all commands with their parameters
  let match: RegExpExecArray | null;
  while ((match = commandRegex.exec(d)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, commandRaw, paramsStr] = match;
    const command = commandRaw;
    const upper = command.toUpperCase();
    const relative = command !== upper;

    const params = parseParams(paramsStr);

    // Param counts per command
    const paramCounts: Record<string, number> = {
      M: 2,
      L: 2,
      H: 1,
      V: 1,
      C: 6,
      S: 4,
      Q: 4,
      T: 2,
      A: 7,
      Z: 0,
    };

    const paramCount = paramCounts[upper];
    if (paramCount === undefined) {
      // Unknown command, append as-is
      rebuiltPath += command + paramsStr;
      continue;
    }

    let i = 0;
    while (i < params.length || paramCount === 0) {
      if (upper === 'Z') {
        // Close path: move current point to subpath start
        rebuiltPath += 'Z ';
        currentPoint = {...subpathStart};
        i += paramCount; // zero
        break; // no params
      }

      // Slice one command's worth of parameters
      const segmentParams = params.slice(i, i + paramCount);
      if (segmentParams.length < paramCount) break; // incomplete command params

      if (upper === 'A') {
        // Arc to cubic bezier conversion

        // Arc params:
        // rx ry xAxisRotation largeArcFlag sweepFlag x y
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, X, Y] =
          segmentParams;

        let [x, y] = [X, Y];

        // For relative coords, adjust x,y
        if (relative) {
          x += currentPoint.x;
          y += currentPoint.y;
        }

        // Convert arc to cubic Bezier segments
        const beziers = arcToCubicBeziers({
          px: currentPoint.x,
          py: currentPoint.y,
          cx: x,
          cy: y,
          rx,
          ry,
          xAxisRotation,
          largeArcFlag: !!largeArcFlag,
          sweepFlag: !!sweepFlag,
        });

        // Each bezier is [p0, p1, p2, p3], we output 'C' commands for control points p1,p2 and endpoint p3
        beziers.forEach(([_, p1, p2, p3]) => {
          // Distort control points and endpoint
          const c1x = distortCoord(p1.x);
          const c1y = distortCoord(p1.y);
          const c2x = distortCoord(p2.x);
          const c2y = distortCoord(p2.y);
          const ex = distortCoord(p3.x);
          const ey = distortCoord(p3.y);

          rebuiltPath += `C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey} `;
          currentPoint = {x: p3.x, y: p3.y};
        });
      } else if (upper === 'H') {
        // Horizontal line: only x changes
        let x = segmentParams[0];
        if (relative) x += currentPoint.x;
        const dx = distortCoord(x);
        rebuiltPath += `L ${dx} ${distortCoord(currentPoint.y)} `;
        currentPoint = {x, y: currentPoint.y};
      } else if (upper === 'V') {
        // Vertical line: only y changes
        let y = segmentParams[0];
        if (relative) y += currentPoint.y;
        const dy = distortCoord(y);
        rebuiltPath += `L ${distortCoord(currentPoint.x)} ${dy} `;
        currentPoint = {x: currentPoint.x, y};
      } else if (upper === 'L') {
        let x = segmentParams[0];
        let y = segmentParams[1];
        if (relative) {
          x += currentPoint.x;
          y += currentPoint.y;
        }
        const bezier = lineToBezier(currentPoint, {x, y});
        // bezier = [p0, cp1, cp2, p3]
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, cp1, cp2, p3] = bezier;

        // Distort control points and end point
        const c1x = distortCoord(cp1.x);
        const c1y = distortCoord(cp1.y);
        const c2x = distortCoord(cp2.x);
        const c2y = distortCoord(cp2.y);
        const ex = distortCoord(p3.x);
        const ey = distortCoord(p3.y);

        rebuiltPath += `C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey} `;

        currentPoint = {x, y};
      } else {
        // General commands with multiple coords (M,L,C,S,Q,T)
        // Distort all numeric values (flags for arcs are handled above)

        // For relative commands, add current point offsets
        const coords: number[] = [];
        for (let idx = 0; idx < segmentParams.length; idx += 2) {
          let x = segmentParams[idx];
          let y = segmentParams[idx + 1];

          if (relative) {
            x += currentPoint.x;
            y += currentPoint.y;
          }

          const dx = distortCoord(x);
          const dy = distortCoord(y);
          coords.push(dx, dy);
        }

        // Choose command letter: always absolute now (to simplify)
        const cmd = upper;
        // Rebuild the command string
        rebuiltPath += cmd + ' ';
        for (let idx = 0; idx < coords.length; idx += 2) {
          rebuiltPath += `${coords[idx]} ${coords[idx + 1]} `;
        }

        // Update current point based on command type and last coords
        switch (upper) {
          case 'M':
          case 'L':
          case 'T':
            currentPoint = {
              x: coords[coords.length - 2],
              y: coords[coords.length - 1],
            };
            if (upper === 'M') subpathStart = {...currentPoint};
            break;
          case 'C':
            currentPoint = {
              x: coords[coords.length - 2],
              y: coords[coords.length - 1],
            };
            break;
          case 'S':
          case 'Q':
            currentPoint = {
              x: coords[coords.length - 2],
              y: coords[coords.length - 1],
            };
            break;
        }
      }

      i += paramCount;

      if (paramCount === 0) break; // Safety for Z command (no params)
    }
  }

  return rebuiltPath.trim();
}
