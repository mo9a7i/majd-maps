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
      ...project.shapes.map(shapeToFeature),
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
