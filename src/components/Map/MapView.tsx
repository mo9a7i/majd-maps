"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import ActionsCard, { type Panel } from "./ActionsCard";
import LocationPermissionDialog from "./LocationPermissionDialog";
import { useProject } from "@/lib/ProjectContext";
import { exportJSON } from "@/lib/exporters";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuLabel,
} from "@/components/ui/context-menu";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

export default function MapView() {
  const { exportProject } = useProject();

  const [pickingCoords, setPickingCoords] = useState(false);
  // Holds the callback registered by AddMarkerDialog when picking mode starts
  const pickCallbackRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("none");

  // Stores the latlng of the last right-click so the context menu label can render it
  const [rightClickCoords, setRightClickCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleStartPickingCoords = useCallback(
    (onPick: (lat: number, lng: number) => void) => {
      pickCallbackRef.current = onPick;
      setPickingCoords(true);
    },
    []
  );

  const handleRightClick = useCallback((lat: number, lng: number) => {
    setRightClickCoords({ lat, lng });
  }, []);

  const handleFlyToMarker = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
    setTimeout(() => setFlyTo(null), 200);
  }, []);

  const openPanel = useCallback((panel: Panel) => {
    setActivePanel(panel);
    setSheetOpen(true);
  }, []);

  // Context menu: "أضف علامة هنا"
  const handleContextAddMarker = useCallback(() => {
    if (!rightClickCoords) return;
    openPanel("add-marker");
  }, [rightClickCoords, openPanel]);

  // Context menu: "نسخ الإحداثيات"
  const handleContextCopyCoords = useCallback(() => {
    if (!rightClickCoords) return;
    const { lat, lng } = rightClickCoords;
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, [rightClickCoords]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        variant="app"
        onSave={() => exportJSON(exportProject())}
        onOpenSidebar={() => setSheetOpen(true)}
      />

      <div className="flex-1 relative min-h-0">
        <ContextMenu>
          <ContextMenuTrigger render={<div className="absolute inset-0 isolate" />}>
            <MapCanvas
              onMapClick={handleMapClick}
              onRightClick={handleRightClick}
              pickingCoords={pickingCoords}
              flyToMarker={flyTo}
            />
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>
                {rightClickCoords
                  ? `${rightClickCoords.lat.toFixed(4)}, ${rightClickCoords.lng.toFixed(4)}`
                  : "الخريطة"}
              </ContextMenuLabel>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleContextAddMarker}>
              <span>📍</span>
              أضف علامة هنا
            </ContextMenuItem>
            <ContextMenuItem onClick={handleContextCopyCoords}>
              <span>📋</span>
              نسخ الإحداثيات
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openPanel("marker-list")}>
              <span>📂</span>
              قائمة العلامات
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openPanel("draw")}>
              <span>✏️</span>
              أدوات الرسم
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <LocationPermissionDialog onLocated={(lat, lng) => setFlyTo({ lat, lng })} />

        <ActionsCard
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          activePanel={activePanel}
          onActivePanelChange={setActivePanel}
          onFlyToMarker={handleFlyToMarker}
          pickingCoords={pickingCoords}
          onStartPickingCoords={handleStartPickingCoords}
        />
      </div>
    </div>
  );
}
