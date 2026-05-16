"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, EntityType } from "@/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const NODE_COLORS: Record<EntityType, string> = {
  PERSON: "#e07a5f",
  PLACE: "#b7b0a6",
  PROJECT: "#2a9d8f",
  EVENT: "#f2cc8f",
  HEALTH: "#e07a5f",
  TRAVEL: "#f2cc8f",
  TOPIC: "#6f665a",
  ORGANIZATION: "#f2cc8f",
};

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

  const graphData = useMemo(
    () => data || { nodes: [], links: [] },
    [data]
  );
  const isEmpty = !isLoading && graphData.nodes.length === 0;

  return (
    <div ref={containerRef} className="relative h-full min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
      {dimensions.width > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#0f0e0b"
          nodeRelSize={4}
          nodeLabel="name"
          linkLabel="label"
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.006}
          linkColor={() => "rgba(176,178,255,0.35)"}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = Math.max(10, 14 / globalScale);
            ctx.font = `${fontSize}px Sora, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = node.color || "#e07a5f";
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.max(4, node.val), 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "#f4f0ea";
            ctx.fillText(label, node.x, node.y + Math.max(12, node.val + 10));
          }}
        />
      ) : null}

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="max-w-sm text-center" style={{ color: "#c5c7c9" }}>
            No graph yet. Add memories in chat to build connections.
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div style={{ color: "#c5c7c9" }}>Loading knowledge graph...</div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#131313] to-transparent" />
    </div>
  );
}