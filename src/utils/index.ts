import {diagramData} from '../types';

// Create SVG pie chart from data
export function createPieChart(data: diagramData, radius = 100): SVGSVGElement {
  const svgNS = 'http://www.w3.org/2000/svg';
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', `${radius * 2}`);
  svg.setAttribute('height', `${radius * 2}`);
  svg.setAttribute('viewBox', `0 0 ${radius * 2} ${radius * 2}`);

  data.forEach((slice, index) => {
    const [cx, cy] = [radius, radius];
    const startAngle = (cumulative / total) * 2 * Math.PI;
    const endAngle = ((cumulative + slice.value) / total) * 2 * Math.PI;

    // Calculate label angle in the middle of the slice
    const labelAngle = (startAngle + endAngle) / 2;
    cumulative += slice.value;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', getColor(index));

    svg.appendChild(path);

    // Create label text element
    const labelRadius = radius * 0.6; // move label inside the slice, closer to center
    const labelX = cx + labelRadius * Math.cos(labelAngle);
    const labelY = cy + labelRadius * Math.sin(labelAngle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', labelX.toString());
    text.setAttribute('y', labelY.toString());
    text.setAttribute('fill', '#000');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '12');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = slice.name.toString();

    svg.appendChild(text);
  });

  return svg;
}

// Simple color generator
function getColor(i: number): string {
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
  return colors[i % colors.length];
}
