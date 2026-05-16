"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { useProject } from "@/lib/ProjectContext";
import type { Marker, CircleShape } from "@/lib/types";
import type { DrawnShapeInit } from "./AddShapeDialog";

// Fix default Leaflet marker icons (webpack asset issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Pre-extracted SVG inner content from lucide-react (stroke is applied by the wrapper)
const LUCIDE_SVG: Record<string, string> = {
  default: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
  tower:   `<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>`,
  camera:  `<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>`,
  car:     `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>`,
  person:  `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
};

function createMarkerIcon(color: string, iconType?: string) {
  const paths = LUCIDE_SVG[iconType ?? "default"] ?? LUCIDE_SVG.default;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">${svg}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

interface MapCanvasProps {
  onMapClick?: (lat: number, lng: number) => void;
  /** Called on every right-click; nearestMarker is set when click is within ~28px of a marker */
  onRightClick?: (lat: number, lng: number, nearestMarker: Marker | null) => void;
  onShapeCreated?: (shape: DrawnShapeInit) => void;
  onCircleClick?: (circle: CircleShape) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  pickingCoords?: boolean;
  flyToMarker?: { lat: number; lng: number } | null;
  searchCircle?: { lat: number; lng: number; radius: number } | null;
  highlightedId?: string | null;
  /** When set, only items whose IDs are in this set are shown; others are hidden */
  visibleIds?: Set<string> | null;
}

export default function MapCanvas({ onMapClick, onRightClick, onShapeCreated, onCircleClick, onCenterChange, pickingCoords, flyToMarker, searchCircle, highlightedId, visibleIds }: MapCanvasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const shapesLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<L.Control | null>(null);
  const searchCircleRef = useRef<L.Circle | null>(null);
  // Instances keyed by item id for hover highlighting
  const markerInstancesRef = useRef<Record<string, L.Marker>>({});
  const shapeInstancesRef = useRef<Record<string, L.Path>>({});
  const onRightClickRef = useRef(onRightClick);
  onRightClickRef.current = onRightClick;
  const onShapeCreatedRef = useRef(onShapeCreated);
  onShapeCreatedRef.current = onShapeCreated;
  const onCircleClickRef = useRef(onCircleClick);
  onCircleClickRef.current = onCircleClick;
  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;
  // Keep a live ref to markers so the contextmenu handler can do hit-testing
  // without re-registering itself every time the marker list changes
  const { state } = useProject();
  const markersRef = useRef(state.markers);
  markersRef.current = state.markers;

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

    // Leaflet Draw — Arabic locale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dl = (L as any).drawLocal;
    dl.draw.toolbar.buttons.polyline   = "ارسم خطًا";
    dl.draw.toolbar.buttons.polygon    = "ارسم مضلعًا";
    dl.draw.toolbar.actions.title      = "إلغاء الرسم";
    dl.draw.toolbar.actions.text       = "إلغاء";
    dl.draw.toolbar.finish.title       = "إنهاء الرسم";
    dl.draw.toolbar.finish.text        = "إنهاء";
    dl.draw.toolbar.undo.title         = "حذف آخر نقطة";
    dl.draw.toolbar.undo.text          = "حذف";
    dl.draw.handlers.polyline.tooltip  = { start: "انقر لبدء رسم الخط", cont: "انقر لمتابعة الخط", end: "انقر مرتين لإنهاء الخط" };
    dl.draw.handlers.polygon.tooltip   = { start: "انقر لبدء رسم المضلع", cont: "انقر لمتابعة المضلع", end: "انقر على النقطة الأولى لإغلاق المضلع" };
    dl.draw.handlers.simpleshape.tooltip = { end: "اسحب ثم أفلت لإنهاء الرسم" };

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
      edit: false,
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    mapRef.current = map;

    return () => {
      map.remove();
      // Report initial center, then on every pan/zoom
    const reportCenter = () => {
      const c = map.getCenter();
      onCenterChangeRef.current?.(c.lat, c.lng);
    };
    // Defer so Leaflet finishes positioning the container before getCenter() is called
    const initTimer = setTimeout(reportCenter, 0);
    map.on("moveend", reportCenter);

    clearTimeout(initTimer);
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

  // Right-click handler — pixel-distance hit test to find nearest marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      const clickPt = map.latLngToContainerPoint(e.latlng);
      const THRESHOLD_PX = 28;
      let nearestMarker: Marker | null = null;
      let minDist = THRESHOLD_PX;
      for (const marker of markersRef.current) {
        const markerPt = map.latLngToContainerPoint([marker.lat, marker.lng]);
        const dist = Math.hypot(clickPt.x - markerPt.x, clickPt.y - markerPt.y);
        if (dist < minDist) {
          minDist = dist;
          nearestMarker = marker;
        }
      }
      onRightClickRef.current?.(e.latlng.lat, e.latlng.lng, nearestMarker);
    };
    map.on("contextmenu", handler);
    return () => { map.off("contextmenu", handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    markerInstancesRef.current = {};
    state.markers.forEach((marker) => {
      const icon = createMarkerIcon(marker.color, marker.iconType);
      const m = L.marker([marker.lat, marker.lng], { icon });
      const popupLines = [
        marker.label ? `<strong>${marker.label}</strong>` : null,
        marker.company ? `<span style="font-size:0.85em;color:#555">${marker.company}</span>` : null,
      ].filter(Boolean).join("<br/>");
      if (popupLines) m.bindPopup(popupLines);
      m.bindTooltip(marker.label || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`, {
        direction: "top",
        offset: [0, -22],
      });
      m.addTo(layer);
      markerInstancesRef.current[marker.id] = m;
    });
  }, [state.markers]);

  // Sync shapes layer
  useEffect(() => {
    const layer = shapesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    shapeInstancesRef.current = {};
    state.shapes.forEach((shape) => {
      let instance: L.Path;
      if (shape.type === "circle") {
        instance = L.circle([shape.lat, shape.lng], {
          radius: shape.radius,
          color: shape.color,
          fillColor: shape.color,
          fillOpacity: 0.1,
          dashArray: "6 4",
          weight: 2,
        });
        instance.on("click", () => onCircleClickRef.current?.(shape));
      } else {
        const latlngs = shape.points.map(([lat, lng]) => L.latLng(lat, lng));
        if (shape.type === "line") {
          instance = L.polyline(latlngs, { color: shape.color, weight: 3 });
        } else {
          instance = L.polygon(latlngs, { color: shape.color, weight: 2, fillOpacity: 0.2 });
        }
      }
      instance.addTo(layer);
      shapeInstancesRef.current[shape.id] = instance;
    });
  }, [state.shapes]);

  // Highlight + visibility effect
  useEffect(() => {
    // Markers
    Object.entries(markerInstancesRef.current).forEach(([id, m]) => {
      const el = m.getElement();
      if (!el) return;
      el.style.transition = "opacity 0.2s ease, transform 0.15s ease";
      const hidden = visibleIds != null && !visibleIds.has(id);
      if (hidden) {
        el.style.opacity = "0";
        el.style.transform = "";
        el.style.pointerEvents = "none";
        m.setZIndexOffset(0);
      } else if (!highlightedId) {
        el.style.opacity = "1";
        el.style.transform = "";
        el.style.pointerEvents = "";
        m.setZIndexOffset(0);
      } else if (id === highlightedId) {
        el.style.opacity = "1";
        el.style.transform = "scale(1.4)";
        el.style.pointerEvents = "";
        m.setZIndexOffset(500);
      } else {
        el.style.opacity = "0.15";
        el.style.transform = "scale(0.95)";
        el.style.pointerEvents = "";
        m.setZIndexOffset(0);
      }
    });

    // Shapes
    Object.entries(shapeInstancesRef.current).forEach(([id, path]) => {
      const isCircle = path instanceof L.Circle;
      const isLine = path instanceof L.Polyline && !(path instanceof L.Polygon);
      const hidden = visibleIds != null && !visibleIds.has(id);
      if (hidden) {
        path.setStyle({ opacity: 0, fillOpacity: 0 });
      } else if (!highlightedId) {
        path.setStyle({ opacity: 1, fillOpacity: isCircle ? 0.1 : isLine ? 1 : 0.2, weight: isLine ? 3 : isCircle ? 2 : 2 });
      } else if (id === highlightedId) {
        path.setStyle({ opacity: 1, fillOpacity: isCircle ? 0.25 : isLine ? 1 : 0.4, weight: isLine ? 5 : isCircle ? 3 : 3 });
      } else {
        path.setStyle({ opacity: 0.12, fillOpacity: 0.04 });
      }
    });
  }, [highlightedId, visibleIds]);

  // Search circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (searchCircleRef.current) {
      searchCircleRef.current.remove();
      searchCircleRef.current = null;
    }
    if (searchCircle) {
      const circle = L.circle([searchCircle.lat, searchCircle.lng], {
        radius: searchCircle.radius,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        dashArray: "8 5",
        weight: 2,
      }).addTo(map);
      searchCircleRef.current = circle;
      map.fitBounds(circle.getBounds(), { padding: [30, 30], maxZoom: 14 });
    }
  }, [searchCircle]);

  // Pan to marker — preserves current zoom level
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToMarker) return;
    map.panTo([flyToMarker.lat, flyToMarker.lng], { animate: true, duration: 0.6 });
  }, [flyToMarker]);

  // Leaflet Draw — CREATED event: pass shape to parent for metadata collection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      if (event.layerType === "polyline") {
        const pts = (layer as L.Polyline).getLatLngs() as L.LatLng[];
        onShapeCreatedRef.current?.({
          type: "line",
          points: pts.map((p) => [p.lat, p.lng] as [number, number]),
        });
      } else if (event.layerType === "polygon") {
        const pts = ((layer as L.Polygon).getLatLngs()[0]) as L.LatLng[];
        onShapeCreatedRef.current?.({
          type: "polygon",
          points: pts.map((p) => [p.lat, p.lng] as [number, number]),
        });
      }
    };
    map.on(L.Draw.Event.CREATED, handler);
    return () => { map.off(L.Draw.Event.CREATED, handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="w-full h-full"
      style={{ minHeight: 0 }}
    />
  );
}
