"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, EntityType } from "@/types";
import { TARUN_GRAPH_DATA } from "@/lib/tarun-context";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const NODE_COLORS: Record<EntityType, string> = {
  PERSON: "#ddb7ff",
  PLACE: "#c5c7c9",
  PROJECT: "#b0b2ff",
  EVENT: "#b0b2ff",
  HEALTH: "#ddb7ff",
  TRAVEL: "#c6c6c8",
  TOPIC: "#8f9194",
  ORGANIZATION: "#c0c1ff",
};

const SAMPLE_GRAPH: GraphData = TARUN_GRAPH_DATA;

interface KnowledgeGraphProps {
  data?: GraphData;
  isLoading?: boolean;
}

export function KnowledgeGraph({ data, isLoading = false }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      setDimensions({
        width: element.clientWidth,
        height: Math.max(520, element.clientHeight),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => data || SAMPLE_GRAPH, [data]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
      {dimensions.width > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#131313"
          nodeRelSize={4}
          nodeLabel="name"
          linkLabel="label"
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.006}
          linkColor={() => "rgba(176,178,255,0.35)"}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = Math.max(10, 14 / globalScale);
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = node.color || "#b0b2ff";
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.max(4, node.val), 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "#e5e2e1";
            ctx.fillText(label, node.x, node.y + Math.max(12, node.val + 10));
          }}
        />
      ) : null}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div style={{ color: "#c5c7c9" }}>Loading knowledge graph...</div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#131313] to-transparent" />
    </div>
  );
}