export interface Marker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color: string;
}

export interface LineShape {
  id: string;
  type: "line";
  points: [number, number][];
  color: string;
  label?: string;
}

export interface PolygonShape {
  id: string;
  type: "polygon";
  points: [number, number][];
  color: string;
  label?: string;
}

export type Shape = LineShape | PolygonShape;

export interface Project {
  version: string;
  markers: Marker[];
  shapes: Shape[];
}

export const PROJECT_VERSION = "1.0.0";

export const MARKER_COLORS = [
  { name: "أحمر", value: "#ef4444" },
  { name: "أزرق", value: "#3b82f6" },
  { name: "أخضر", value: "#22c55e" },
  { name: "أصفر", value: "#eab308" },
  { name: "برتقالي", value: "#f97316" },
  { name: "بنفسجي", value: "#a855f7" },
  { name: "أسود", value: "#111827" },
  { name: "رمادي", value: "#6b7280" },
] as const;

export type MarkerColor = (typeof MARKER_COLORS)[number]["value"];
