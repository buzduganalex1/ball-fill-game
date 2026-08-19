export function colorNumber(color: string | undefined, fallback = 0xffffff): number {
  if (!color) return fallback;
  const normalized = color.trim().replace(/^#/, '');
  const value = Number.parseInt(normalized, 16);
  return Number.isFinite(value) ? value : fallback;
}

export const WORLD_COLORS = [
  { fill: '#9f263d', edge: '#ff6c78', trail: '#ff536c', minion: '#d64c57' },
  { fill: '#227ca0', edge: '#8ceaff', trail: '#65dcff', minion: '#5ca9c8' },
  { fill: '#8d6a1d', edge: '#ffd262', trail: '#ffcf5d', minion: '#c79b3d' },
  { fill: '#394f9f', edge: '#ffe55c', trail: '#82a6ff', minion: '#6078c9' },
  { fill: '#26133f', edge: '#dc72ff', trail: '#bd6cff', minion: '#5d3477' },
  { fill: '#23663d', edge: '#70f09e', trail: '#65e896', minion: '#4e9b68' },
  { fill: '#a34b19', edge: '#ffb64f', trail: '#ff9a3d', minion: '#d17635' },
  { fill: '#53731b', edge: '#c9ff54', trail: '#b4f24a', minion: '#7f9f39' },
  { fill: '#214f72', edge: '#71dfff', trail: '#69d2ff', minion: '#477c9c' },
  { fill: '#5b2d72', edge: '#ff8be8', trail: '#8fe8ff', minion: '#805397' },
] as const;
