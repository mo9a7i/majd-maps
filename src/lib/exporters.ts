import * as XLSX from "xlsx";
import type { Project, Marker, Shape } from "./types";

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function exportJSON(project: Project) {
  downloadBlob(
    JSON.stringify(project, null, 2),
    "majd-maps-project.json",
    "application/json"
  );
}

// ─── GeoJSON ─────────────────────────────────────────────────────────────────

function markerToFeature(m: Marker) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [m.lng, m.lat] },
    properties: { name: m.label ?? "", marker_color: m.color },
  };
}

function shapeToFeature(s: Shape) {
  if (s.type === "circle") return null; // no GeoJSON for circles yet
  if (s.type === "line") {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: s.points.map(([lat, lng]) => [lng, lat]),
      },
      properties: { name: s.label ?? "", stroke: s.color },
    };
  } else {
    const ring = [...s.points, s.points[0]];
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ring.map(([lat, lng]) => [lng, lat])],
      },
      properties: { name: s.label ?? "", stroke: s.color, fill: s.color },
    };
  }
}

export function exportGeoJSON(project: Project) {
  const geojson = {
    type: "FeatureCollection",
    features: [
      ...project.markers.map(markerToFeature),
      ...project.shapes.map(shapeToFeature).filter(Boolean),
    ],
  };
  downloadBlob(JSON.stringify(geojson, null, 2), "majd-maps.geojson", "application/json");
}

// ─── KML ─────────────────────────────────────────────────────────────────────

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markerToKml(m: Marker) {
  return `    <Placemark>
      <name>${escapeXml(m.label ?? "")}</name>
      <Style><IconStyle><color>ff${m.color.replace("#", "")}</color></IconStyle></Style>
      <Point><coordinates>${m.lng},${m.lat},0</coordinates></Point>
    </Placemark>`;
}

function shapeToKml(s: Shape) {
  if (s.type === "circle") return ""; // no KML for circles yet
  if (s.type === "line") {
    const coords = s.points.map(([lat, lng]) => `${lng},${lat},0`).join(" ");
    return `    <Placemark>
      <name>${escapeXml(s.label ?? "")}</name>
      <LineString><coordinates>${coords}</coordinates></LineString>
    </Placemark>`;
  } else {
    const ring = [...s.points, s.points[0]];
    const coords = ring.map(([lat, lng]) => `${lng},${lat},0`).join(" ");
    return `    <Placemark>
      <name>${escapeXml(s.label ?? "")}</name>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>
    </Placemark>`;
  }
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

// Arabic column headers — English aliases handled in importer for back-compat
type XlsxRow = {
  "النوع": string;
  "العنوان": string;
  "خط العرض": number | "";
  "خط الطول": number | "";
  "الشركة": string;
  "نوع الأيقونة": string;
  "اللون": string;
  "تاريخ الإضافة": string;
  "تاريخ التعديل": string;
  "نصف القطر": number | "";
  "الإحداثيات": string;
};

export function exportXLSX(project: Project) {
  const today = new Date().toISOString().split("T")[0];
  const rows: XlsxRow[] = [];

  for (const m of project.markers) {
    rows.push({
      "النوع": "marker",
      "العنوان": m.label ?? "",
      "خط العرض": m.lat,
      "خط الطول": m.lng,
      "الشركة": m.company ?? "",
      "نوع الأيقونة": m.iconType ?? "default",
      "اللون": m.color,
      "تاريخ الإضافة": m.dateAdded ?? today,
      "تاريخ التعديل": m.dateEdited ?? "",
      "نصف القطر": "",
      "الإحداثيات": "",
    });
  }

  for (const s of project.shapes) {
    if (s.type === "circle") {
      rows.push({
        "النوع": "circle",
        "العنوان": s.label ?? "",
        "خط العرض": s.lat,
        "خط الطول": s.lng,
        "الشركة": s.company ?? "",
        "نوع الأيقونة": "",
        "اللون": s.color,
        "تاريخ الإضافة": s.dateAdded ?? "",
        "تاريخ التعديل": "",
        "نصف القطر": s.radius,
        "الإحداثيات": "",
      });
    } else {
      rows.push({
        "النوع": s.type,
        "العنوان": s.label ?? "",
        "خط العرض": "",
        "خط الطول": "",
        "الشركة": s.company ?? "",
        "نوع الأيقونة": "",
        "اللون": s.color,
        "تاريخ الإضافة": s.dateAdded ?? "",
        "تاريخ التعديل": "",
        "نصف القطر": "",
        "الإحداثيات": JSON.stringify(s.points),
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  // Templates sheet — key/value rows (Arabic keys)
  const tpl = project.emailTemplate;
  const tplRows = [
    { المفتاح: "الرأس",            القيمة: tpl?.header ?? "" },
    { المفتاح: "النص",             القيمة: tpl?.body ?? "" },
    { المفتاح: "الذيل",            القيمة: tpl?.footer ?? "" },
    { المفتاح: "اسم_الموظف",       القيمة: tpl?.employeeName ?? "" },
    { المفتاح: "اسم_المنظمة",      القيمة: tpl?.orgName ?? "" },
    { المفتاح: "البنود", القيمة: (tpl?.items ?? []).join(",") },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tplRows), "Templates");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rasad.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}


export function exportKML(project: Project) {
  const placemarks = [
    ...project.markers.map(markerToKml),
    ...project.shapes.map(shapeToKml),
  ].join("\n");

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>مجد مابس</name>
${placemarks}
  </Document>
</kml>`;
  downloadBlob(kml, "majd-maps.kml", "application/vnd.google-earth.kml+xml");
}
