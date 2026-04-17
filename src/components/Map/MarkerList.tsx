"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import AddMarkerDialog from "./AddMarkerDialog";
import type { Marker } from "@/lib/types";

interface MarkerListProps {
  onFlyToMarker: (lat: number, lng: number) => void;
}

export default function MarkerList({ onFlyToMarker }: MarkerListProps) {
  const { state, deleteMarker } = useProject();
  const [search, setSearch] = useState("");
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);

  const filtered = state.markers.filter((m) =>
    (m.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
    `${m.lat},${m.lng}`.includes(search)
  );

  function handleCopyCoords(marker: Marker) {
    navigator.clipboard.writeText(`${marker.lat}, ${marker.lng}`);
  }

  if (editingMarker) {
    return (
      <AddMarkerDialog
        editMarker={editingMarker}
        pickingCoords={false}
        onStartPickingCoords={() => {}}
        onClose={() => setEditingMarker(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">قائمة العلامات</h3>

      {state.markers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          لا توجد علامات بعد. أضف علامة من القائمة أعلاه.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">البحث عن علامة</label>
            <Input
              placeholder="ابحث باسم أو إحداثيات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm h-8"
            />
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">لا توجد نتائج.</p>
            ) : (
              filtered.map((marker) => (
                <div
                  key={marker.id}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div
                    className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onFlyToMarker(marker.lat, marker.lng)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ background: marker.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {marker.label || "بدون تسمية"}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => setEditingMarker(marker)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleCopyCoords(marker)}
                      title="نسخ الإحداثيات"
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
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
