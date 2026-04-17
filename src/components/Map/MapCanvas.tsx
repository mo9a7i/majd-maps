"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { useProject } from "@/lib/ProjectContext";
import { MARKER_COLORS } from "@/lib/types";

// Fix default Leaflet marker icons (webpack asset issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createColorIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -28],
  });
}

interface MapCanvasProps {
  onMapClick?: (lat: number, lng: number) => void;
  onRightClick?: (lat: number, lng: number) => void;
  pickingCoords?: boolean;
  flyToMarker?: { lat: number; lng: number } | null;
}

export default function MapCanvas({ onMapClick, onRightClick, pickingCoords, flyToMarker }: MapCanvasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const shapesLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<L.Control | null>(null);
  const { state, addShape } = useProject();

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [24.774265, 46.738586], // Riyadh
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    shapesLayerRef.current = L.layerGroup().addTo(map);

    // Leaflet Draw — set up synchronously while map is alive
    const featureGroup = new L.FeatureGroup().addTo(map);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawControl = new (L.Control as any).Draw({
      draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
        polyline: { shapeOptions: { color: "#3b82f6" } },
        polygon: { shapeOptions: { color: "#a855f7", fillOpacity: 0.2 } },
      },
      edit: { featureGroup },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawControlRef.current = null;
    };
  }, []);

  // Map click handler for coordinate picking
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (pickingCoords && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [pickingCoords, onMapClick]);

  // Right-click handler — fires before the ContextMenu opens
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onRightClick) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onRightClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("contextmenu", handler);
    return () => { map.off("contextmenu", handler); };
  }, [onRightClick]);

  // Update cursor when picking
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickingCoords) {
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
  }, [pickingCoords]);

  // Sync markers layer
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    state.markers.forEach((marker) => {
      const colorEntry = MARKER_COLORS.find((c) => c.value === marker.color);
      const icon = createColorIcon(marker.color);
      const m = L.marker([marker.lat, marker.lng], { icon });
      if (marker.label) {
        m.bindPopup(`<strong>${marker.label}</strong>`);
      }
      m.bindTooltip(marker.label || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`, {
        direction: "top",
        offset: [0, -28],
      });
      m.addTo(layer);
      void colorEntry;
    });
  }, [state.markers]);

  // Sync shapes layer
  useEffect(() => {
    const layer = shapesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    state.shapes.forEach((shape) => {
      const latlngs = shape.points.map(([lat, lng]) => L.latLng(lat, lng));
      if (shape.type === "line") {
        L.polyline(latlngs, { color: shape.color, weight: 3 }).addTo(layer);
      } else {
        L.polygon(latlngs, { color: shape.color, weight: 2, fillOpacity: 0.2 }).addTo(layer);
      }
    });
  }, [state.shapes]);

  // Fly to marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToMarker) return;
    map.flyTo([flyToMarker.lat, flyToMarker.lng], 14, { duration: 1.2 });
  }, [flyToMarker]);

  // Leaflet Draw — CREATED event wired separately so addShape ref stays fresh
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      if (event.layerType === "polyline") {
        const pts = (layer as L.Polyline).getLatLngs() as L.LatLng[];
        addShape({
          type: "line",
          points: pts.map((p) => [p.lat, p.lng] as [number, number]),
          color: "#3b82f6",
        });
      } else if (event.layerType === "polygon") {
        const pts = ((layer as L.Polygon).getLatLngs()[0]) as L.LatLng[];
        addShape({
          type: "polygon",
          points: pts.map((p) => [p.lat, p.lng] as [number, number]),
          color: "#a855f7",
        });
      }
    };
    map.on(L.Draw.Event.CREATED, handler);
    return () => { map.off(L.Draw.Event.CREATED, handler); };
  }, [addShape]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="w-full h-full"
      style={{ minHeight: 0 }}
    />
  );
}
