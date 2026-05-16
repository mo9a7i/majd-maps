import * as XLSX from "xlsx";
import type { Project, Marker, Shape, EmailTemplate } from "./types";
import { PROJECT_VERSION, MARKER_COLORS } from "./types";

const DEFAULT_COLOR = MARKER_COLORS[0].value; // #ef4444 red

function resolveColor(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_COLOR;
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{3,6}$/.test(trimmed)) return trimmed;
  const named: Record<string, string> = {
    red: "#ef4444", blue: "#3b82f6", green: "#22c55e",
    yellow: "#eab308", orange: "#f97316", purple: "#a855f7",
    black: "#111827", gray: "#6b7280", grey: "#6b7280",
    أحمر: "#ef4444", أزرق: "#3b82f6", أخضر: "#22c55e",
    أصفر: "#eab308", برتقالي: "#f97316", بنفسجي: "#a855f7",
    أسود: "#111827", رمادي: "#6b7280",
  };
  return named[trimmed.toLowerCase()] ?? named[trimmed] ?? DEFAULT_COLOR;
}

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

// ─── XLSX ─────────────────────────────────────────────────────────────────────

export async function importXLSX(buffer: ArrayBuffer): Promise<Project> {
  const wb = XLSX.read(buffer, { type: "array" });

  // ── Templates sheet (optional) ─────────────────────────────────────────────
  let emailTemplate: EmailTemplate | undefined;
  const tplSheet = wb.Sheets["Templates"];
  if (tplSheet) {
    const tplRows = XLSX.utils.sheet_to_json<Record<string, string>>(tplSheet, { defval: "" });
    const kv: Record<string, string> = {};
    tplRows.forEach((r) => {
      // Accept Arabic keys (new) and English keys (legacy)
      const k = String(r["المفتاح"] ?? r["key"] ?? "").trim();
      const v = String(r["القيمة"] ?? r["value"] ?? "").trim();
      if (k) kv[k] = v;
    });
    const itemsRaw = kv["البنود"] ?? kv["items"] ?? "";
    // Items exported as comma-separated texts; fall back to newline for old format
    const items = itemsRaw
      ? (itemsRaw.includes(",") ? itemsRaw.split(",") : itemsRaw.split("\n"))
          .map((s) => s.trim()).filter(Boolean)
      : [];
    const selectedItems: number[] = [];
    emailTemplate = {
      header:        kv["الرأس"]       ?? kv["header"]        ?? "",
      body:          kv["النص"]        ?? kv["body"]          ?? "",
      footer:        kv["الذيل"]       ?? kv["footer"]        ?? "",
      employeeName:  kv["اسم_الموظف"]  ?? kv["employee_name"] ?? "",
      orgName:       kv["اسم_المنظمة"] ?? kv["org_name"]      ?? "",
      items,
      selectedItems,
    };
  }

  // ── Data sheet ─────────────────────────────────────────────────────────────
  const ws = wb.Sheets["Data"] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (!rows.length) throw new Error("الملف لا يحتوي على بيانات.");

  const markers: Marker[] = [];
  const shapes: Shape[] = [];
  let idx = 0;

  // Helper: read a cell accepting Arabic column name first, then English fallbacks
  function col(row: Record<string, unknown>, ar: string, ...en: string[]): string {
    for (const key of [ar, ...en]) {
      if (row[key] != null && String(row[key]).trim() !== "") return String(row[key]).trim();
    }
    return "";
  }

  for (const row of rows) {
    const rowType = (col(row, "النوع", "type") || "marker").toLowerCase();
    const label = col(row, "العنوان", "title", "label", "name") || undefined;
    const color = resolveColor(
      row["اللون"] ?? row["color"] ?? row["icon color"]
    );
    const id = `xlsx-${idx++}`;
    const company = col(row, "الشركة", "company") || undefined;
    const dateAdded = col(row, "تاريخ الإضافة", "date added", "dateAdded", "date_added") || undefined;

    if (rowType === "marker" || !rowType) {
      const lat = parseFloat(col(row, "خط العرض", "lat", "latitude"));
      const lng = parseFloat(col(row, "خط الطول", "lng", "longitude"));
      if (isNaN(lat) || isNaN(lng)) continue;
      markers.push({
        id, lat, lng, label, color, company,
        iconType: col(row, "نوع الأيقونة", "icon type", "iconType", "icon_type") || undefined,
        dateAdded,
        dateEdited: col(row, "تاريخ التعديل", "date edited", "dateEdited") || undefined,
      });
    } else if (rowType === "circle") {
      const lat = parseFloat(col(row, "خط العرض", "lat"));
      const lng = parseFloat(col(row, "خط الطول", "lng"));
      const radius = parseFloat(col(row, "نصف القطر", "radius") || "500");
      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) continue;
      shapes.push({ id, type: "circle", lat, lng, radius, color, label, company, dateAdded });
    } else if (rowType === "line" || rowType === "polygon") {
      const coordsRaw = col(row, "الإحداثيات", "coords");
      if (!coordsRaw) continue;
      let points: [number, number][];
      try { points = JSON.parse(coordsRaw); } catch { continue; }
      if (!Array.isArray(points) || !points.length) continue;
      shapes.push({ id, type: rowType as "line" | "polygon", points, color, label, company, dateAdded });
    }
  }

  if (!markers.length && !shapes.length) {
    throw new Error("لم يتم العثور على صفوف صالحة.");
  }

  return { version: PROJECT_VERSION, markers, shapes, emailTemplate };
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
