"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import Navbar from "@/components/Navbar";
import ActionsCard from "./ActionsCard";
import LocationPermissionDialog from "./LocationPermissionDialog";
import { useProject } from "@/lib/ProjectContext";
import { exportXLSX } from "@/lib/exporters";
import { importXLSX } from "@/lib/importers";
import { MARKER_COLORS } from "@/lib/types";
import type { Marker, Shape, CircleShape } from "@/lib/types";
import type { DrawnShapeInit } from "./AddShapeDialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddMarkerDialog from "@/components/Map/AddMarkerDialog";
import AddShapeDialog from "@/components/Map/AddShapeDialog";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

const DEFAULT_COLOR = MARKER_COLORS[0].value;

function formatRadius(m: number): string {
  if (m < 1000) return `${m} م`;
  const km = m / 1000;
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} كم`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapView() {
  const { exportProject, importProject, addMarker, addShape, deleteMarker, state } = useProject();

  // ── Import (no Sheet — just a hidden file input) ────────────────────────────
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const project = await importXLSX(buffer);
      importProject(project);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد.");
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  // ── Map-picking ──────────────────────────────────────────────────────────────
  const [pickingCoords, setPickingCoords] = useState(false);
  const pickCallbackRef = useRef<((lat: number, lng: number) => void) | null>(null);

  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  // ── Tools side sheet ─────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Add-marker bottom sheet ──────────────────────────────────────────────────
  const [pendingMarker, setPendingMarker] = useState<Marker | null>(null);
  const [addMarkerOpen, setAddMarkerOpen] = useState(false);

  // ── Edit-marker bottom sheet ─────────────────────────────────────────────────
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [editMarkerOpen, setEditMarkerOpen] = useState(false);

  // ── Edit-shape bottom sheet ───────────────────────────────────────────────────
  const [editingShape, setEditingShape] = useState<Shape | null>(null);
  const [editShapeOpen, setEditShapeOpen] = useState(false);

  // ── Add-shape bottom sheet (after drawing) ───────────────────────────────────
  const [pendingShape, setPendingShape] = useState<DrawnShapeInit | null>(null);
  const [addShapeOpen, setAddShapeOpen] = useState(false);


  // ── Area search ───────────────────────────────────────────────────────────────
  const [searchAreaCoords, setSearchAreaCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAreaOpen, setSearchAreaOpen] = useState(false);
  const [searchRadius, setSearchRadius] = useState(500);
  const [searchCircle, setSearchCircle] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [searchLat, setSearchLat] = useState<string>("");
  const [searchLng, setSearchLng] = useState<string>("");

  // ── Circle filter (click saved circle → show items inside) ───────────────────
  const [circleFilter, setCircleFilter] = useState<CircleShape | null>(null);

  const handleCircleClick = useCallback((circle: CircleShape) => {
    setCircleFilter(circle);
    setSheetOpen(true);
  }, []);

  const circleFilteredIds = useMemo(() => {
    if (!circleFilter) return null;
    return state.markers
      .filter((m) => haversineDistance(circleFilter.lat, circleFilter.lng, m.lat, m.lng) <= circleFilter.radius)
      .map((m) => m.id);
  }, [circleFilter, state.markers]);

  // ── Map center (for distance-sorted list) ─────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 24.774265, lng: 46.738586 });

  // ── Visible IDs (map hides items not in the filtered list) ────────────────────
  const [visibleIds, setVisibleIds] = useState<Set<string> | null>(null);

  // ── List hover → map highlight ────────────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // ── Right-click context ───────────────────────────────────────────────────────
  const [rightClickCoords, setRightClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [rightClickedMarker, setRightClickedMarker] = useState<Marker | null>(null);

  // ────────────────────────────────────────────────────────────────────────────

  const openAddMarkerSheet = useCallback(
    (lat: number, lng: number) => {
      const id = uuidv4();
      const marker: Marker = { id, lat, lng, color: DEFAULT_COLOR };
      addMarker(marker);
      setPendingMarker(marker);
      setAddMarkerOpen(true);
    },
    [addMarker]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (pickingCoords && pickCallbackRef.current) {
        pickCallbackRef.current(lat, lng);
        pickCallbackRef.current = null;
        setPickingCoords(false);
      }
    },
    [pickingCoords]
  );

  const handleAddMarker = useCallback(() => {
    pickCallbackRef.current = openAddMarkerSheet;
    setPickingCoords(true);
  }, [openAddMarkerSheet]);

  const handleContextAddMarker = useCallback(() => {
    if (!rightClickCoords) return;
    openAddMarkerSheet(rightClickCoords.lat, rightClickCoords.lng);
  }, [rightClickCoords, openAddMarkerSheet]);

  const handleContextCopyCoords = useCallback(() => {
    if (!rightClickCoords) return;
    navigator.clipboard.writeText(`${rightClickCoords.lat.toFixed(6)}, ${rightClickCoords.lng.toFixed(6)}`);
  }, [rightClickCoords]);

  const handleContextSearchArea = useCallback(() => {
    if (!rightClickCoords) return;
    const defaultRadius = 500;
    setSearchAreaCoords(rightClickCoords);
    setSearchLat(rightClickCoords.lat.toFixed(6));
    setSearchLng(rightClickCoords.lng.toFixed(6));
    setSearchRadius(defaultRadius);
    setSearchCircle({ ...rightClickCoords, radius: defaultRadius });
    setSearchAreaOpen(true);
  }, [rightClickCoords]);

  const handleSearchCoordChange = useCallback((field: "lat" | "lng", raw: string) => {
    if (field === "lat") setSearchLat(raw);
    else setSearchLng(raw);
    const lat = field === "lat" ? parseFloat(raw) : parseFloat(searchLat);
    const lng = field === "lng" ? parseFloat(raw) : parseFloat(searchLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const coords = { lat, lng };
      setSearchAreaCoords(coords);
      setSearchCircle((prev) => ({ lat, lng, radius: prev?.radius ?? searchRadius }));
    }
  }, [searchLat, searchLng, searchRadius]);

  const handleSliderChange = useCallback((r: number) => {
    setSearchRadius(r);
    setSearchAreaCoords((coords) => {
      if (coords) setSearchCircle({ ...coords, radius: r });
      return coords;
    });
  }, []);

  const handleSaveSearchArea = useCallback(() => {
    if (!searchAreaCoords) return;
    addShape({ type: "circle", lat: searchAreaCoords.lat, lng: searchAreaCoords.lng, radius: searchRadius, color: "#3b82f6" });
    setSearchCircle(null);
    setSearchAreaOpen(false);
  }, [searchAreaCoords, searchRadius, addShape]);

  const handleRightClick = useCallback((lat: number, lng: number, nearestMarker: Marker | null) => {
    setRightClickedMarker(nearestMarker);
    setRightClickCoords({ lat, lng });
  }, []);

  const handleShapeCreated = useCallback((shape: DrawnShapeInit) => {
    setPendingShape(shape);
    setAddShapeOpen(true);
  }, []);

  const handleFlyToMarker = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
    setTimeout(() => setFlyTo(null), 200);
  }, []);


  const closeAddMarkerSheet = useCallback(() => {
    setPendingMarker(null);
    setAddMarkerOpen(false);
  }, []);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setEditMarkerOpen(true);
  }, []);

  const handleEditShape = useCallback((shape: Shape) => {
    setEditingShape(shape);
    setEditShapeOpen(true);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Hidden import file input — no Sheet needed */}
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <Navbar
        variant="app"
        onSave={() => exportXLSX(exportProject())}
        onImport={() => importFileRef.current?.click()}
        onOpenSidebar={() => setSheetOpen(true)}
        onAddMarker={handleAddMarker}
        onOpenDraw={() => setSheetOpen(true)}
      />

      <div className="flex-1 relative min-h-0">
        <ContextMenu>
          <ContextMenuTrigger render={<div className="absolute inset-0 isolate" />}>
            <MapCanvas
              onMapClick={handleMapClick}
              onRightClick={handleRightClick}
              onShapeCreated={handleShapeCreated}
              onCircleClick={handleCircleClick}
              onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
              visibleIds={visibleIds}
              pickingCoords={pickingCoords}
              flyToMarker={flyTo}
              searchCircle={searchCircle}
              highlightedId={highlightedId}
            />
          </ContextMenuTrigger>

          <ContextMenuContent>
            {rightClickedMarker ? (
              <>
                <ContextMenuGroup>
                  <ContextMenuLabel className="space-y-0.5 font-normal">
                    <p className="font-semibold">{rightClickedMarker.label || "بدون تسمية"}</p>
                    {rightClickedMarker.company && (
                      <p className="text-xs text-muted-foreground">{rightClickedMarker.company}</p>
                    )}
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {rightClickedMarker.lat.toFixed(5)}, {rightClickedMarker.lng.toFixed(5)}
                    </p>
                  </ContextMenuLabel>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => { handleEditMarker(rightClickedMarker); setRightClickedMarker(null); }}>
                  <span>✏️</span> تعديل
                </ContextMenuItem>
                <ContextMenuItem onClick={() => { deleteMarker(rightClickedMarker.id); setRightClickedMarker(null); }}>
                  <span>🗑️</span> حذف
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleContextCopyCoords}>
                  <span>📋</span> نسخ الإحداثيات
                </ContextMenuItem>
              </>
            ) : (
              <>
                <ContextMenuGroup>
                  <ContextMenuLabel>
                    {rightClickCoords
                      ? `${rightClickCoords.lat.toFixed(4)}, ${rightClickCoords.lng.toFixed(4)}`
                      : "الخريطة"}
                  </ContextMenuLabel>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleContextAddMarker}>
                  <span>📍</span> أضف علامة هنا
                </ContextMenuItem>
                <ContextMenuItem onClick={handleContextSearchArea}>
                  <span>🔍</span> بحث في هذه المنطقة
                </ContextMenuItem>
                <ContextMenuItem onClick={handleContextCopyCoords}>
                  <span>📋</span> نسخ الإحداثيات
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => setSheetOpen(true)}>
                  <span>📂</span> قائمة العناصر
                </ContextMenuItem>
                {searchCircle && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setSearchCircle(null)}>
                      <span>✕</span> إزالة دائرة البحث
                    </ContextMenuItem>
                  </>
                )}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {/* Picking-mode hint */}
        {pickingCoords && (
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-1000">
            <div className="bg-background border border-border rounded-full px-4 py-2 text-sm shadow-md">
              📍 انقر على الخريطة لتحديد الموقع
            </div>
          </div>
        )}

        <LocationPermissionDialog onLocated={(lat, lng) => setFlyTo({ lat, lng })} />

        <ActionsCard
          open={sheetOpen}
          onOpenChange={(open) => { setSheetOpen(open); if (!open) { setCircleFilter(null); setVisibleIds(null); } }}
          onFlyToMarker={handleFlyToMarker}
          onEditMarker={handleEditMarker}
          onEditShape={handleEditShape}
          onHoverItem={setHighlightedId}
          circleFilter={circleFilter ?? undefined}
          filterIds={circleFilteredIds ?? undefined}
          mapCenter={mapCenter}
          onVisibleIdsChange={setVisibleIds}
        />

        {/* Add-marker bottom sheet */}
        <Sheet open={addMarkerOpen} onOpenChange={(open) => { if (!open) closeAddMarkerSheet(); }}>
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            {pendingMarker && (
              <AddMarkerDialog
                preplacedMarker={pendingMarker}
                onClose={closeAddMarkerSheet}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Edit-marker bottom sheet */}
        <Sheet open={editMarkerOpen} onOpenChange={(open) => { if (!open) { setEditMarkerOpen(false); setEditingMarker(null); } }}>
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            {editingMarker && (
              <AddMarkerDialog
                editMarker={editingMarker}
                onClose={() => { setEditMarkerOpen(false); setEditingMarker(null); }}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Edit-shape bottom sheet */}
        <Sheet open={editShapeOpen} onOpenChange={(open) => { if (!open) { setEditShapeOpen(false); setEditingShape(null); } }}>
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            {editingShape && (
              <AddShapeDialog
                editShape={editingShape}
                onClose={() => { setEditShapeOpen(false); setEditingShape(null); }}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Add-shape bottom sheet (after drawing a line/polygon) */}
        <Sheet open={addShapeOpen} onOpenChange={(open) => { if (!open) { setPendingShape(null); setAddShapeOpen(false); } }}>
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            {pendingShape && (
              <AddShapeDialog
                shape={pendingShape}
                onClose={() => { setPendingShape(null); setAddShapeOpen(false); }}
              />
            )}
          </SheetContent>
        </Sheet>


        {/* Import error sheet — only shown when an error occurs */}
        <Sheet open={!!importError} onOpenChange={(open) => { if (!open) setImportError(null); }}>
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">خطأ في الاستيراد</h3>
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                {importError}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setImportError(null); importFileRef.current?.click(); }}
                >
                  حاول مرة أخرى
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setImportError(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Area search bottom sheet */}
        <Sheet
          open={searchAreaOpen}
          onOpenChange={(open) => {
            if (!open) setSearchCircle(null);
            setSearchAreaOpen(open);
          }}
        >
          <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl" showCloseButton>
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-sm mb-2">بحث في هذه المنطقة</h3>
                <div className="grid grid-cols-2 gap-2" dir="ltr">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Lat</label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={searchLat}
                      onChange={(e) => handleSearchCoordChange("lat", e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Lng</label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={searchLng}
                      onChange={(e) => handleSearchCoordChange("lng", e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">نطاق البحث</span>
                  <span className="text-sm font-semibold tabular-nums">{formatRadius(searchRadius)}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={50000}
                  step={100}
                  value={searchRadius}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                  className="w-full accent-blue-950"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100 م</span>
                  <span>1 كم</span>
                  <span>10 كم</span>
                  <span>50 كم</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-950 text-white" size="sm" onClick={handleSaveSearchArea}>
                  حفظ المنطقة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchCircle(null); setSearchAreaOpen(false); }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
