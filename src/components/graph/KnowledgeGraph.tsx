"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityType, GraphData } from "@/types";
import { NODE_COLORS } from "@/lib/graph/theme";
import type {
  ForceGraphMethods,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-24 w-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
    </div>
  ),
});

interface KnowledgeGraphProps {
  data?: GraphData;
  isLoading?: boolean;
}

type ForceGraphNode = NodeObject;
type ForceGraphLink = LinkObject;

function nodeText(node: ForceGraphNode, field: string): string {
  const value = node[field];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function useStableGraphData(data?: GraphData) {
  const ref = useRef<GraphData | undefined>(data);
  const signatureRef = useRef<string>(data ? JSON.stringify(data) : "");
  const nextSignature = data ? JSON.stringify(data) : "";

  if (nextSignature !== signatureRef.current) {
    signatureRef.current = nextSignature;
    ref.current = data;
  }

  return ref.current;
}

export function KnowledgeGraph({ data, isLoading = false }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const focusedNodeRef = useRef<string | null>(null);
  const lastTapRef = useRef<number>(0);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      setDimensions({
        width: Math.min(element.clientWidth, 1400),
        height: Math.min(Math.max(520, element.clientHeight), 900),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const graphData = useStableGraphData(data) || { nodes: [], links: [] };
  const isEmpty = !isLoading && graphData.nodes.length === 0;

  return (
    <div ref={containerRef} className="relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-black/20 md:min-h-[520px]">
      {dimensions.width > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#0f0e0b"
          nodeRelSize={4}
          nodeLabel="name"
          linkLabel="label"
          d3AlphaDecay={0.05}
          cooldownTicks={120}
          onEngineStop={() => graphRef.current?.pauseAnimation()}
          onNodeClick={(node: ForceGraphNode) => {
            if (!node?.id) return;
            if (isCoarsePointer || dimensions.width < 640) {
              const nodeId = String(node.id);
              const now = Date.now();
              if (focusedNodeRef.current === nodeId && now - lastTapRef.current < 1500) {
                router.push(`/contexts/${nodeId}`);
                focusedNodeRef.current = null;
                return;
              }
              focusedNodeRef.current = nodeId;
              lastTapRef.current = now;
              if (node.x != null && node.y != null) {
                graphRef.current?.centerAt(node.x, node.y, 400);
                graphRef.current?.zoom(2.2, 500);
              }
              return;
            }
            router.push(`/contexts/${node.id}`);
          }}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(link: ForceGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
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
          nodeCanvasObject={(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = nodeText(node, "name");
            if (!label || node.x == null || node.y == null) return;
            const baseFont = dimensions.width < 480 ? 12 : 14;
            const fontSize = Math.max(10, baseFont / globalScale);
            ctx.font = `${fontSize}px Sora, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const color = nodeText(node, "color");
            const type = nodeText(node, "type") as EntityType;
            ctx.fillStyle = color || NODE_COLORS[type] || "#e07a5f";
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.max(4, node.val ?? 4), 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "#f4f0ea";
            ctx.fillText(label, node.x, node.y + Math.max(12, (node.val ?? 4) + 10));
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
