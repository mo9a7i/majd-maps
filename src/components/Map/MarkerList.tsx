"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import { ICON_TYPES } from "@/lib/types";
import type { Marker, Shape, CircleShape } from "@/lib/types";
import { MapPin, Radio, Camera, Car, User, X, Building2, Minus, Hexagon, Circle, Mail } from "lucide-react";
import EmailTemplateDialog from "@/components/Map/EmailTemplateDialog";

/** Sentinel value used to represent items with no company set */
const BLANK = "__blank__";

function isBlankCompany(v: string | undefined | null): boolean {
  return !v || v.trim() === "";
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  default: MapPin,
  tower: Radio,
  camera: Camera,
  car: Car,
  person: User,
};

interface MarkerListProps {
  onFlyToMarker: (lat: number, lng: number) => void;
  onEditMarker: (marker: Marker) => void;
  onEditShape: (shape: Shape) => void;
  onHoverItem: (id: string | null) => void;
  /** When set, only markers with these IDs are shown (circle filter) */
  filterIds?: string[];
  /** The circle that produced filterIds — shown as a banner */
  circleFilter?: CircleShape;
  mapCenter?: { lat: number; lng: number };
  onVisibleIdsChange?: (ids: Set<string> | null) => void;
}

function shapeTypeLabel(shape: Shape): string {
  if (shape.type === "line") return "خط";
  if (shape.type === "polygon") return "مضلع";
  const r = shape.radius;
  return `دائرة — ${r >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)} كم` : `${r} م`}`;
}

function shapeTypeIcon(shape: Shape): string {
  if (shape.type === "line") return "↗";
  if (shape.type === "polygon") return "⬡";
  return "◯";
}

function shapeCenterCoords(shape: Shape): { lat: number; lng: number } | null {
  if (shape.type === "circle") return { lat: shape.lat, lng: shape.lng };
  if (!shape.points.length) return null;
  const lat = shape.points.reduce((s, p) => s + p[0], 0) / shape.points.length;
  const lng = shape.points.reduce((s, p) => s + p[1], 0) / shape.points.length;
  return { lat, lng };
}

export default function MarkerList({
  onFlyToMarker,
  onEditMarker,
  onEditShape,
  onHoverItem,
  filterIds,
  circleFilter,
  mapCenter,
  onVisibleIdsChange,
}: MarkerListProps) {
  const { state, deleteMarker, deleteShape } = useProject();
  const [search, setSearch] = useState("");
  const [activeIconTypes, setActiveIconTypes] = useState<Set<string>>(new Set());
  const [activeShapeTypes, setActiveShapeTypes] = useState<Set<string>>(new Set());
  const [activeCompanies, setActiveCompanies] = useState<Set<string>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const q = search.toLowerCase();

  // Derive available icon types (only those present in markers)
  const availableIconTypes = useMemo(() => {
    const present = new Set(state.markers.map((m) => m.iconType ?? "default"));
    return ICON_TYPES.filter((t) => present.has(t.id));
  }, [state.markers]);

  // Derive available item types (markers + shape types present in data)
  const availableShapeTypes = useMemo(() => {
    const shapeTypes = new Set(state.shapes.map((s) => s.type));
    const types: { id: string; label: string; Icon: React.ElementType }[] = [];
    if (state.markers.length > 0) types.push({ id: "marker", label: "نقاط", Icon: MapPin });
    if (shapeTypes.has("line"))    types.push({ id: "line",   label: "خطوط",   Icon: Minus });
    if (shapeTypes.has("polygon")) types.push({ id: "polygon",label: "مضلعات", Icon: Hexagon });
    if (shapeTypes.has("circle"))  types.push({ id: "circle", label: "دوائر",  Icon: Circle });
    return types;
  }, [state.markers, state.shapes]);

  // Derive unique companies from markers + shapes; add BLANK if any item has no company
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    let hasBlank = false;
    state.markers.forEach((m) => {
      if (isBlankCompany(m.company)) hasBlank = true;
      else set.add(m.company!);
    });
    state.shapes.forEach((s) => {
      if (isBlankCompany(s.company)) hasBlank = true;
      else set.add(s.company!);
    });
    const sorted = Array.from(set).sort();
    if (hasBlank) sorted.push(BLANK);
    return sorted;
  }, [state.markers, state.shapes]);

  function toggleIconType(id: string) {
    setActiveIconTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleShapeType(id: string) {
    setActiveShapeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleCompany(name: string) {
    setActiveCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function clearFilters() {
    setActiveIconTypes(new Set());
    setActiveShapeTypes(new Set());
    setActiveCompanies(new Set());
    setSearch("");
  }

  const filteredMarkers = useMemo(() => {
    // Hide all markers when type filter is active but "marker" type isn't selected
    if (activeShapeTypes.size > 0 && !activeShapeTypes.has("marker")) return [];
    const results = state.markers.filter((m) => {
      if (filterIds && !filterIds.includes(m.id)) return false;
      const matchesSearch =
        (m.label ?? "").toLowerCase().includes(q) ||
        (m.company ?? "").toLowerCase().includes(q) ||
        `${m.lat},${m.lng}`.includes(q);
      const matchesIcon = activeIconTypes.size === 0 || activeIconTypes.has(m.iconType ?? "default");
      const matchesCompany =
        activeCompanies.size === 0 ||
        (isBlankCompany(m.company) ? activeCompanies.has(BLANK) : activeCompanies.has(m.company!));
      return matchesSearch && matchesIcon && matchesCompany;
    });
    if (mapCenter) {
      results.sort(
        (a, b) =>
          haversineDistance(mapCenter.lat, mapCenter.lng, a.lat, a.lng) -
          haversineDistance(mapCenter.lat, mapCenter.lng, b.lat, b.lng)
      );
    }
    return results;
  }, [state.markers, q, activeIconTypes, activeShapeTypes, activeCompanies, filterIds, mapCenter]);

  const filteredShapes = useMemo(() => {
    // Shapes are not included in the circle filter (only markers are)
    if (filterIds) return [];
    const results = state.shapes.filter((s) => {
      const matchesSearch =
        (s.label ?? "").toLowerCase().includes(q) ||
        (s.company ?? "").toLowerCase().includes(q) ||
        shapeTypeLabel(s).toLowerCase().includes(q);
      const matchesType = activeShapeTypes.size === 0 || activeShapeTypes.has(s.type);
      const matchesCompany =
        activeCompanies.size === 0 ||
        (isBlankCompany(s.company) ? activeCompanies.has(BLANK) : activeCompanies.has(s.company!));
      return matchesSearch && matchesType && matchesCompany;
    });
    if (mapCenter) {
      results.sort((a, b) => {
        const ca = shapeCenterCoords(a);
        const cb = shapeCenterCoords(b);
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return (
          haversineDistance(mapCenter.lat, mapCenter.lng, ca.lat, ca.lng) -
          haversineDistance(mapCenter.lat, mapCenter.lng, cb.lat, cb.lng)
        );
      });
    }
    return results;
  }, [state.shapes, q, activeShapeTypes, activeCompanies, filterIds, mapCenter]);

  const totalCount = state.markers.length + state.shapes.length;
  const hasResults = filteredMarkers.length > 0 || filteredShapes.length > 0;
  const hasActiveFilters = activeIconTypes.size > 0 || activeShapeTypes.size > 0 || activeCompanies.size > 0 || search.length > 0;

  // Stable ref so the callback is never a useEffect dependency (avoids infinite loops)
  const onVisibleIdsChangeRef = useRef(onVisibleIdsChange);
  onVisibleIdsChangeRef.current = onVisibleIdsChange;

  useEffect(() => {
    const isFiltered = hasActiveFilters || filterIds != null;
    if (!isFiltered) {
      onVisibleIdsChangeRef.current?.(null);
      return;
    }
    const ids = new Set<string>();
    filteredMarkers.forEach((m) => ids.add(m.id));
    filteredShapes.forEach((s) => ids.add(s.id));
    // Always keep the triggering circle itself visible
    if (circleFilter) ids.add(circleFilter.id);
    onVisibleIdsChangeRef.current?.(ids);
  // onVisibleIdsChange intentionally excluded — accessed via ref above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMarkers, filteredShapes, hasActiveFilters, filterIds, circleFilter]);

  function handleCopyCoords(lat: number, lng: number) {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">

      {/* ── Fixed top section: search + filters ── */}
      <div className="px-5 pt-3 pb-0 border-b border-border shrink-0 space-y-2">

        {/* Circle filter banner */}
        {circleFilter && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
            <span className="text-blue-700 dark:text-blue-300 flex-1">
              ◯ {circleFilter.label || "دائرة"} — {filteredMarkers.length} عنصر داخلها
            </span>
          </div>
        )}

        {/* Search input */}
        {totalCount > 0 && (
          <Input
            placeholder={`ابحث في ${totalCount} عنصر...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm h-8"
          />
        )}

        {/* Icon-type filter chips */}
        {availableIconTypes.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1">
            {availableIconTypes.map((t) => {
              const Icon = ICON_COMPONENTS[t.id] ?? MapPin;
              const active = activeIconTypes.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleIconType(t.id)}
                  title={t.label}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-blue-950 text-white border-blue-950"
                      : "bg-background text-muted-foreground border-border hover:border-blue-950/50"
                  }`}
                >
                  <Icon size={11} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Shape-type filter chips */}
        {availableShapeTypes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1">
            {availableShapeTypes.map(({ id, label, Icon }) => {
              const active = activeShapeTypes.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleShapeType(id)}
                  title={label}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-blue-950 text-white border-blue-950"
                      : "bg-background text-muted-foreground border-border hover:border-blue-950/50"
                  }`}
                >
                  <Icon size={11} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Company filter chips */}
        {availableCompanies.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pb-2">
            <Building2 size={12} className="text-muted-foreground shrink-0" />
            {availableCompanies.map((company) => {
              const active = activeCompanies.has(company);
              const isBlankPill = company === BLANK;
              const label = isBlankPill ? "بلا منظمة" : company;
              return (
                <button
                  key={company}
                  onClick={() => toggleCompany(company)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors truncate max-w-[140px] ${
                    active
                      ? "bg-blue-950 text-white border-blue-950"
                      : isBlankPill
                        ? "bg-background text-muted-foreground/60 border-dashed border-border hover:border-blue-950/50"
                        : "bg-background text-muted-foreground border-border hover:border-blue-950/50"
                  }`}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="pb-2">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={11} />
              مسح الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 min-h-0 overflow-y-auto ">
        {totalCount === 0 ? (
          <p className="text-xs text-muted-foreground">
            لا توجد عناصر بعد. أضف علامة أو ارسم شكلًا.
          </p>
        ) : (
          <div className="">
            {!hasResults && (
              <p className="text-xs text-muted-foreground py-1">لا توجد نتائج.</p>
            )}

            {/* ── Markers ── */}
            {filteredMarkers.map((marker) => {
              const Icon = ICON_COMPONENTS[marker.iconType ?? "default"] ?? MapPin;
              return (
                <div
                  key={marker.id}
                  onMouseEnter={() => onHoverItem(marker.id)}
                  onMouseLeave={() => onHoverItem(null)}
                  className="border-b border-border p-3 space-y-2"
                >
                  <div
                    className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onFlyToMarker(marker.lat, marker.lng)}
                  >
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: marker.color }}
                    >
                      <Icon size={12} color="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {marker.label || "بدون تسمية"}
                      </p>
                      {marker.company && (
                        <p className="text-xs text-muted-foreground truncate">{marker.company}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70" dir="ltr">
                        {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => onEditMarker(marker)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleCopyCoords(marker.lat, marker.lng)}
                    >
                      نسخ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMarker(marker.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* ── Shapes ── */}
            {filteredShapes.map((shape) => {
              const center = shapeCenterCoords(shape);
              return (
                <div
                  key={shape.id}
                  onMouseEnter={() => onHoverItem(shape.id)}
                  onMouseLeave={() => onHoverItem(null)}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div
                    className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => center && onFlyToMarker(center.lat, center.lng)}
                  >
                    <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: shape.color }}
                      />
                      <span className="text-xs text-muted-foreground">{shapeTypeIcon(shape)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {shape.label || shapeTypeLabel(shape)}
                      </p>
                      {shape.company && (
                        <p className="text-xs text-muted-foreground truncate">{shape.company}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70">
                        {shapeTypeLabel(shape)}
                        {shape.type !== "circle" && shape.points.length > 0 &&
                          ` — ${shape.points.length} نقطة`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => onEditShape(shape)}
                    >
                      تعديل
                    </Button>
                    {center && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => handleCopyCoords(center.lat, center.lng)}
                      >
                        نسخ
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteShape(shape.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Email template button — only when circle filter is active ── */}
      {circleFilter && (
        <div className="px-5 py-3 border-t border-border shrink-0">
          <Button
            className="w-full gap-2 bg-blue-950 text-white hover:bg-blue-900"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail size={14} />
            قالب البريد الإلكتروني
          </Button>
        </div>
      )}

      {emailDialogOpen && (
        <EmailTemplateDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          filteredMarkers={filteredMarkers}
        />
      )}
    </div>
  );
}
