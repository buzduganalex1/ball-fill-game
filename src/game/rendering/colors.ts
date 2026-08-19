export function colorNumber(color: string | undefined, fallback = 0xffffff): number {
  if (!color) return fallback;
  const normalized = color.trim().replace(/^#/, '');
  const value = Number.parseInt(normalized, 16);
  return Number.isFinite(value) ? value : fallback;
}

export const WORLD_COLORS = [
  { fill: '#9f263d', edge: '#ff6c78', glow: '#ff4d62', trail: '#ff536c', minion: '#d64c57', minionEdge: '#9f263d' },
  { fill: '#227ca0', edge: '#8ceaff', glow: '#54d7ff', trail: '#65dcff', minion: '#5ca9c8', minionEdge: '#28718d' },
  { fill: '#8d6a1d', edge: '#ffd262', glow: '#ffc246', trail: '#ffcf5d', minion: '#c79b3d', minionEdge: '#87661f' },
  { fill: '#394f9f', edge: '#ffe55c', glow: '#ffe45e', trail: '#82a6ff', minion: '#6078c9', minionEdge: '#354985' },
  { fill: '#26133f', edge: '#dc72ff', glow: '#a85bff', trail: '#bd6cff', minion: '#5d3477', minionEdge: '#321943' },
  { fill: '#23663d', edge: '#70f09e', glow: '#48dc7e', trail: '#65e896', minion: '#4e9b68', minionEdge: '#225b37' },
  { fill: '#a34b19', edge: '#ffb64f', glow: '#ff892e', trail: '#ff9a3d', minion: '#d17635', minionEdge: '#8e431d' },
  { fill: '#53731b', edge: '#c9ff54', glow: '#a7e836', trail: '#b4f24a', minion: '#7f9f39', minionEdge: '#4b661b' },
  { fill: '#214f72', edge: '#71dfff', glow: '#5cbcff', trail: '#69d2ff', minion: '#477c9c', minionEdge: '#214d6c' },
  { fill: '#5b2d72', edge: '#ff8be8', glow: '#ff6fcd', trail: '#8fe8ff', minion: '#805397', minionEdge: '#4f2865' },
] as const;
