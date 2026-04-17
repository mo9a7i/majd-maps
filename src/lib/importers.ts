import type { Project, Marker, Shape } from "./types";
import { PROJECT_VERSION, MARKER_COLORS } from "./types";

const DEFAULT_COLOR = MARKER_COLORS[0].value;

// ─── GeoJSON ─────────────────────────────────────────────────────────────────

export function importGeoJSON(raw: unknown): Project {
  const geojson = raw as { type: string; features?: unknown[] };
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("الملف ليس بتنسيق GeoJSON صحيح (FeatureCollection مطلوب).");
  }

  const markers: Marker[] = [];
  const shapes: Shape[] = [];
  let idx = 0;

  for (const feat of (geojson.features ?? []) as Array<{
    type: string;
    geometry: { type: string; coordinates: unknown };
    properties?: Record<string, unknown>;
  }>) {
    if (!feat.geometry) continue;
    const props = feat.properties ?? {};
    const label = (props.name ?? props.label ?? props.title ?? "") as string;
    const color =
      typeof props.marker_color === "string" ? props.marker_color : DEFAULT_COLOR;
    const id = `imported-${idx++}`;

    switch (feat.geometry.type) {
      case "Point": {
        const [lng, lat] = feat.geometry.coordinates as [number, number];
        markers.push({ id, lat, lng, label: label || undefined, color });
        break;
      }
      case "LineString": {
        const pts = (feat.geometry.coordinates as [number, number][]).map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );
        shapes.push({ id, type: "line", points: pts, color, label: label || undefined });
        break;
      }
      case "Polygon": {
        const ring = (feat.geometry.coordinates as [number, number][][])[0];
        const pts = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
        shapes.push({ id, type: "polygon", points: pts, color, label: label || undefined });
        break;
      }
    }
  }

  return { version: PROJECT_VERSION, markers, shapes };
}

// ─── KML ─────────────────────────────────────────────────────────────────────

export async function importKML(text: string): Promise<Project> {
  const { kml } = await import("@tmcw/togeojson");
  const parser = new DOMParser();
  const dom = parser.parseFromString(text, "text/xml");
  const geojson = kml(dom);
  return importGeoJSON(geojson);
}

// ─── JSON (Project schema) ────────────────────────────────────────────────────

export function importProjectJSON(raw: unknown): Project {
  const obj = raw as Partial<Project>;
  if (!obj || typeof obj !== "object") {
    throw new Error("الملف لا يحتوي على بيانات صالحة.");
  }
  if (!Array.isArray(obj.markers) || !Array.isArray(obj.shapes)) {
    throw new Error("تنسيق الملف غير صحيح. تأكد أنه ملف مشروع مجد مابس.");
  }
  return {
    version: obj.version ?? PROJECT_VERSION,
    markers: obj.markers,
    shapes: obj.shapes,
  };
}
