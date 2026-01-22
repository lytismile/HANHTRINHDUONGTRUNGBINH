
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  width?: number;
  height?: number;
  baseLength?: number;
  midsegmentLength?: number;
  showLabels?: boolean;
  labels?: {
    v1: string;
    v2: string;
    v3: string;
    m1: string;
    m2: string;
  };
}

const TriangleGeometry: React.FC<Props> = ({ 
  width = 300, 
  height = 200, 
  baseLength, 
  midsegmentLength,
  showLabels = true,
  labels = { v1: 'A', v2: 'B', v3: 'C', m1: 'M', m2: 'N' }
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const padding = 50;
    
    // Coordinates
    const A = { x: width / 2, y: padding };
    const B = { x: padding, y: height - padding };
    const C = { x: width - padding, y: height - padding };

    // Midpoints
    const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }; 
    const N = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 }; 

    const drawLine = (p1: {x: number, y: number}, p2: {x: number, y: number}, color: string, width: number = 2) => {
      svg.append("line")
        .attr("x1", p1.x)
        .attr("y1", p1.y)
        .attr("x2", p2.x)
        .attr("y2", p2.y)
        .attr("stroke", color)
        .attr("stroke-width", width)
        .attr("stroke-linecap", "round");
    };

    const drawLabel = (p: {x: number, y: number}, text: string, offset: {x: number, y: number}, color: string = "#1e293b", size: string = "16px") => {
      svg.append("text")
        .attr("x", p.x + offset.x)
        .attr("y", p.y + offset.y)
        .text(text)
        .attr("font-size", size)
        .attr("font-weight", "900")
        .attr("fill", color)
        .attr("text-anchor", "middle")
        .style("filter", "drop-shadow(0px 1px 1px white)");
    };

    // Draw Main Triangle (Blue)
    drawLine(A, B, "#3b82f6", 3);
    drawLine(B, C, "#3b82f6", 3);
    drawLine(C, A, "#3b82f6", 3);

    // Draw Midsegment (Red)
    drawLine(M, N, "#ef4444", 4);

    // Draw Points
    const drawPoint = (p: {x: number, y: number}, color: string) => {
      svg.append("circle")
        .attr("cx", p.x)
        .attr("cy", p.y)
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 2);
    };

    [A, B, C].forEach(p => drawPoint(p, "#3b82f6"));
    [M, N].forEach(p => drawPoint(p, "#ef4444"));

    // Labels
    if (showLabels) {
      drawLabel(A, labels.v1, { x: 0, y: -15 });
      drawLabel(B, labels.v2, { x: -20, y: 20 });
      drawLabel(C, labels.v3, { x: 20, y: 20 });
      drawLabel(M, labels.m1, { x: -25, y: 5 }, "#ef4444");
      drawLabel(N, labels.m2, { x: 25, y: 5 }, "#ef4444");

      // Length labels
      if (baseLength) {
        drawLabel({ x: (B.x + C.x) / 2, y: B.y }, `${baseLength}cm`, { x: 0, y: 25 }, "#64748b", "12px");
      }
      if (midsegmentLength) {
        drawLabel({ x: (M.x + N.x) / 2, y: M.y }, `${midsegmentLength}cm`, { x: 0, y: -15 }, "#ef4444", "12px");
      }
    }

    // Midpoint Indicators (ticks)
    const drawTick = (center: {x: number, y: number}, angle: number) => {
      const len = 6;
      const x1 = center.x - Math.cos(angle) * len;
      const y1 = center.y - Math.sin(angle) * len;
      const x2 = center.x + Math.cos(angle) * len;
      const y2 = center.y + Math.sin(angle) * len;
      svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke", "#94a3b8").attr("stroke-width", 2);
    };

    drawTick({ x: (A.x + M.x) / 2, y: (A.y + M.y) / 2 }, 0);
    drawTick({ x: (M.x + B.x) / 2, y: (M.y + B.y) / 2 }, 0);
    
    drawTick({ x: (A.x + N.x) / 2, y: (A.y + N.y) / 2 }, Math.PI/4);
    drawTick({ x: (A.x + N.x) / 2 + 3, y: (A.y + N.y) / 2 + 3 }, Math.PI/4);
    drawTick({ x: (N.x + C.x) / 2, y: (N.y + C.y) / 2 }, Math.PI/4);
    drawTick({ x: (N.x + C.x) / 2 + 3, y: (N.y + C.y) / 2 + 3 }, Math.PI/4);

  }, [width, height, baseLength, midsegmentLength, showLabels, labels]);

  return (
    <div className="flex justify-center bg-white rounded-[2.5rem] shadow-inner p-6 overflow-hidden border-4 border-slate-50">
      <svg ref={svgRef} width={width} height={height} className="drop-shadow-sm" />
    </div>
  );
};

export default TriangleGeometry;
