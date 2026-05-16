export interface Marker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color: string;
  company?: string;
  iconType?: string;
  dateAdded?: string;
  dateEdited?: string;
}

export interface LineShape {
  id: string;
  type: "line";
  points: [number, number][];
  color: string;
  label?: string;
  company?: string;
  dateAdded?: string;
}

export interface PolygonShape {
  id: string;
  type: "polygon";
  points: [number, number][];
  color: string;
  label?: string;
  company?: string;
  dateAdded?: string;
}

export interface CircleShape {
  id: string;
  type: "circle";
  lat: number;
  lng: number;
  radius: number;
  color: string;
  label?: string;
  company?: string;
  dateAdded?: string;
}

export type Shape = LineShape | PolygonShape | CircleShape;

export interface EmailTemplate {
  header: string;
  body: string;
  footer: string;
  employeeName: string;
  orgName: string;
  /** Full list of configurable checklist items */
  items: string[];
  /** Indices (into items[]) that are currently checked */
  selectedItems: number[];
}

export interface Project {
  version: string;
  markers: Marker[];
  shapes: Shape[];
  emailTemplate?: EmailTemplate;
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

export const ICON_TYPES = [
  { id: "default", label: "افتراضي", emoji: "📍" },
  { id: "tower",   label: "برج اتصالات", emoji: "📡" },
  { id: "camera",  label: "كاميرا", emoji: "📷" },
  { id: "car",     label: "سيارة", emoji: "🚗" },
  { id: "person",  label: "شخص", emoji: "🧑" },
] as const;

export type IconTypeId = (typeof ICON_TYPES)[number]["id"];
