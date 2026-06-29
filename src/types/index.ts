export interface Note {
  id: string
  title: string
  content: string
  path: string
  createdAt: string
  updatedAt: string
  tags: string[]
  links: string[]
}

export interface VaultEntry {
  name: string
  path: string
  type: "file" | "directory"
  children?: VaultEntry[]
}

export interface AppSettings {
  vaultPath: string
  theme: "dark" | "light"
  aiBackendUrl: string
}

export interface SearchResult {
  path: string
  title: string
  snippet: string
  rank: number
  tags: string[]
  updatedAt: string
}

export interface GraphNode {
  id: string
  title: string
  tags: string[]
  updatedAt: string
  degree: number
}

export interface GraphEdge {
  source: string
  target: string
  type: "wikilink"
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
