"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GraphData } from "@/types";
import { NODE_COLORS } from "@/lib/graph/theme";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center" style={{ color: "#c5c7c9" }}>Loading graph...</div>,
});

interface KnowledgeGraphProps {
  data?: GraphData;
  isLoading?: boolean;
}

export function KnowledgeGraph({ data, isLoading = false }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
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
    <div ref={containerRef} className="relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-black/20 md:min-h-[520px]">
      {dimensions.width > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#0f0e0b"
          nodeRelSize={4}
          nodeLabel="name"
          linkLabel="label"
          onNodeClick={(node: any) => {
            if (node?.id) {
              router.push(`/contexts/${node.id}`);
            }
          }}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = link?.label ? String(link.label) : "";
            if (!label) return;

            const start = link.source;
            const end = link.target;
            if (!start || !end) return;
            const startX = typeof start === "object" ? start.x : null;
            const startY = typeof start === "object" ? start.y : null;
            const endX = typeof end === "object" ? end.x : null;
            const endY = typeof end === "object" ? end.y : null;
            if (startX == null || startY == null || endX == null || endY == null) return;

            const x = (startX + endX) / 2;
            const y = (startY + endY) / 2;
            const fontSize = Math.max(8, 12 / globalScale);
            ctx.font = `${fontSize}px Sora, sans-serif`;
            ctx.fillStyle = "rgba(244, 240, 234, 0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, x, y);
          }}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.006}
          linkColor={() => "rgba(176,178,255,0.35)"}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const baseFont = dimensions.width < 480 ? 10 : 14;
            const fontSize = Math.max(9, baseFont / globalScale);
            ctx.font = `${fontSize}px Sora, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = node.color || NODE_COLORS[node.type as keyof typeof NODE_COLORS] || "#e07a5f";
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#131313] to-transparent" />
    </div>
  );
}