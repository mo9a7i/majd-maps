"use client";

import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/lib/ProjectContext";
import { MARKER_COLORS } from "@/lib/types";
import type { Marker } from "@/lib/types";

interface AddMarkerDialogProps {
  /** Called with a callback; MapView calls that callback when the user taps the map */
  onStartPickingCoords: (onPick: (lat: number, lng: number) => void) => void;
  pickingCoords: boolean;
  onClose: () => void;
  editMarker?: Marker;
}

export default function AddMarkerDialog({
  onStartPickingCoords,
  pickingCoords,
  onClose,
  editMarker,
}: AddMarkerDialogProps) {
  const { addMarker, editMarker: saveEdit } = useProject();

  const [lat, setLat] = useState(editMarker?.lat?.toString() ?? "");
  const [lng, setLng] = useState(editMarker?.lng?.toString() ?? "");
  const [label, setLabel] = useState(editMarker?.label ?? "");
  const [color, setColor] = useState(editMarker?.color ?? MARKER_COLORS[0].value);
  const [autoPlacedId, setAutoPlacedId] = useState<string | null>(null);
  const [autoPlacedCoords, setAutoPlacedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Called directly from the map-click event handler in MapView (not from an effect)
  function handlePickedFromMap(pickedLat: number, pickedLng: number) {
    const coords = { lat: pickedLat, lng: pickedLng };
    const newId = uuidv4();
    addMarker({ id: newId, lat: pickedLat, lng: pickedLng, color, label: undefined });
    setAutoPlacedId(newId);
    setAutoPlacedCoords(coords);
    requestAnimationFrame(() => labelInputRef.current?.focus());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (autoPlacedId && autoPlacedCoords) {
      const { lat: latNum, lng: lngNum } = autoPlacedCoords;
      saveEdit({ id: autoPlacedId, lat: latNum, lng: lngNum, label: label || undefined, color });
    } else if (editMarker) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || isNaN(lngNum)) return;
      saveEdit({ id: editMarker.id, lat: latNum, lng: lngNum, label: label || undefined, color });
    } else {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || isNaN(lngNum)) return;
      addMarker({ lat: latNum, lng: lngNum, label: label || undefined, color });
    }
    onClose();
  }

  const isEditing = !!(editMarker || autoPlacedId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-sm">
        {editMarker ? "تعديل علامة" : autoPlacedId ? "أضف تسمية للعلامة" : "أضف علامة"}
      </h3>

      {!autoPlacedId && (
        <>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">خط العرض (Latitude)</label>
            <Input
              type="number"
              step="any"
              placeholder="24.7742"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required={!autoPlacedId}
              className="text-sm"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">خط الطول (Longitude)</label>
            <Input
              type="number"
              step="any"
              placeholder="46.7386"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required={!autoPlacedId}
              className="text-sm"
              dir="ltr"
            />
          </div>
        </>
      )}

      {autoPlacedId && autoPlacedCoords && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2" dir="ltr">
          {autoPlacedCoords.lat.toFixed(5)},{" "}
          {autoPlacedCoords.lng.toFixed(5)}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">التسمية (اختيارية)</label>
        <Input
          ref={labelInputRef}
          type="text"
          placeholder="اسم العلامة"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">لون العلامة</label>
        <div className="flex flex-wrap gap-2">
          {MARKER_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => setColor(c.value)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                color === c.value
                  ? "border-foreground scale-110 shadow-md"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>
      </div>

      {!isEditing && (
        <>
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
            يمكنك الضغط على الخريطة لتحديد الإحداثيات تلقائياً.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`w-full ${pickingCoords ? "border-primary text-primary" : ""}`}
            onClick={() => onStartPickingCoords(handlePickedFromMap)}
          >
            {pickingCoords ? "⏳ انقر على الخريطة..." : "📍 اختر من الخريطة"}
          </Button>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1">
          {isEditing ? "حفظ" : "إضافة"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
