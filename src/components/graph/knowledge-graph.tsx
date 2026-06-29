"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import type { GraphNode, GraphEdge } from "@/types"

interface KnowledgeGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick: (nodeId: string) => void
  highlightTerm?: string
  tagFilter?: string | null
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  title: string
  tags: string[]
  updatedAt: string
  degree: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  title: string
  tags: string[]
  degree: number
}

const TAG_COLORS: Record<string, string> = {
  default: "#6366f1",
  project: "#f59e0b",
  idea: "#10b981",
  person: "#ec4899",
  topic: "#3b82f6",
  reference: "#8b5cf6",
}

function getNodeColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  }
  return TAG_COLORS.default
}

function getNodeSize(degree: number): number {
  return 5 + Math.min(degree * 3, 20)
}

export function KnowledgeGraph({
  nodes,
  edges,
  onNodeClick,
  highlightTerm,
  tagFilter,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    title: "",
    tags: [],
    degree: 0,
  })

  const { filteredNodes, filteredEdges } = useMemo(() => {
    const fNodes = tagFilter
      ? nodes.filter((n) => n.tags.includes(tagFilter))
      : nodes

    const fNodeIds = new Set(fNodes.map((n) => n.id))
    const fEdges = edges
      .filter((e) => fNodeIds.has(e.source) && fNodeIds.has(e.target))
      .map((e) => ({ source: e.source, target: e.target }))

    return { filteredNodes: fNodes, filteredEdges: fEdges }
  }, [nodes, edges, tagFilter])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const g = svg.append("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoom)

    const simNodes: SimNode[] = filteredNodes.map((n) => ({
      id: n.id,
      title: n.title,
      tags: n.tags,
      updatedAt: n.updatedAt,
      degree: n.degree,
    }))

    const simLinks: d3.SimulationLinkDatum<SimNode>[] = filteredEdges

    const simulation = d3
      .forceSimulation<SimNode, d3.SimulationLinkDatum<SimNode>>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, d3.SimulationLinkDatum<SimNode>>(simLinks)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))

    const link = g
      .append("g")
      .selectAll<SVGLineElement, d3.SimulationLinkDatum<SimNode>>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", 1)

    const nodeGroup = g
      .append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")

    nodeGroup
      .append("circle")
      .attr("r", (d) => getNodeSize(d.degree))
      .attr("fill", (d) => getNodeColor(d.tags))
      .attr("stroke", (d) => {
        if (!highlightTerm) return "none"
        return d.title.toLowerCase().includes(highlightTerm.toLowerCase())
          ? "#f59e0b"
          : "none"
      })
      .attr("stroke-width", (d) => {
        if (!highlightTerm) return 0
        return d.title.toLowerCase().includes(highlightTerm.toLowerCase()) ? 3 : 0
      })

    nodeGroup
      .append("text")
      .text((d) => d.title)
      .attr("font-size", "10px")
      .attr("dx", 8)
      .attr("dy", 3)
      .attr("fill", "currentColor")
      .attr("opacity", 0.7)
      .attr("pointer-events", "none")

    nodeGroup.call(
      d3
        .drag<SVGGElement, SimNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
    )

    nodeGroup
      .on("mouseenter", (event, d) => {
        const rect = container.getBoundingClientRect()
        setTooltip({
          visible: true,
          x: event.clientX - rect.left + 15,
          y: event.clientY - rect.top - 10,
          title: d.title,
          tags: d.tags,
          degree: d.degree,
        })
      })
      .on("mousemove", (event) => {
        const rect = container.getBoundingClientRect()
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - rect.left + 15,
          y: event.clientY - rect.top - 10,
        }))
      })
      .on("mouseleave", () => {
        setTooltip((prev) => ({ ...prev, visible: false }))
      })
      .on("click", (event, d) => {
        event.stopPropagation()
        onNodeClick(d.id)
      })

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!)

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [filteredNodes, filteredEdges, highlightTerm, onNodeClick])

  return (
    <div ref={containerRef} className="h-full w-full relative overflow-hidden">
      <svg ref={svgRef} className="h-full w-full" />
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{tooltip.title}</div>
          <div className="mt-0.5 text-muted-foreground">
            {tooltip.tags.length > 0
              ? tooltip.tags.map((t) => `#${t}`).join(" ")
              : "no tags"}
          </div>
          <div className="text-muted-foreground">
            {tooltip.degree} connection{tooltip.degree !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}
