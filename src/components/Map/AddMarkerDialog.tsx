"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/lib/ProjectContext";
import { MapPin, Radio, Camera, Car, User } from "lucide-react";
import { MARKER_COLORS, ICON_TYPES } from "@/lib/types";
import type { Marker } from "@/lib/types";

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  default: MapPin,
  tower:   Radio,
  camera:  Camera,
  car:     Car,
  person:  User,
};

interface AddMarkerDialogProps {
  onClose: () => void;
  /**
   * A marker that was already placed on the map (pre-placed flow).
   * The sheet only asks for label/color; coords are shown read-only.
   */
  preplacedMarker?: Marker;
  /** Editing an existing marker from the list */
  editMarker?: Marker;
}

export default function AddMarkerDialog({
  onClose,
  preplacedMarker,
  editMarker,
}: AddMarkerDialogProps) {
  const { addMarker, editMarker: saveEdit } = useProject();

  const initial = preplacedMarker ?? editMarker;

  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [iconType, setIconType] = useState(initial?.iconType ?? "default");
  const [color, setColor] = useState(initial?.color ?? MARKER_COLORS[0].value);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;

    const companyVal = company.trim() || undefined;
    const iconTypeVal = iconType === "default" ? undefined : iconType;
    const now = new Date().toISOString();

    if (preplacedMarker) {
      saveEdit({
        ...preplacedMarker,
        lat: latNum, lng: lngNum,
        label: label || undefined,
        company: companyVal,
        iconType: iconTypeVal,
        color,
        dateAdded: preplacedMarker.dateAdded ?? now,
      });
    } else if (editMarker) {
      saveEdit({
        ...editMarker,
        lat: latNum, lng: lngNum,
        label: label || undefined,
        company: companyVal,
        iconType: iconTypeVal,
        color,
        dateEdited: now,
      });
    } else {
      addMarker({ lat: latNum, lng: lngNum, label: label || undefined, company: companyVal, iconType: iconTypeVal, color, dateAdded: now });
    }
    onClose();
  }

  const title = editMarker
    ? "تعديل علامة"
    : preplacedMarker
    ? "أضف تسمية للعلامة"
    : "أضف علامة";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-sm">{title}</h3>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">خط العرض (Latitude)</label>
        <Input
          type="number"
          step="any"
          placeholder="24.7742"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          required
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
          required
          className="text-sm"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">التسمية (اختيارية)</label>
        <Input
          type="text"
          placeholder="اسم العلامة"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">اسم المنظمة (اختياري)</label>
        <Input
          type="text"
          placeholder="اسم المنظمة أو المؤسسة"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">نوع الأيقونة</label>
        <div className="flex flex-wrap gap-2">
          {ICON_TYPES.map((t) => {
            const IconComp = ICON_COMPONENTS[t.id] ?? MapPin;
            return (
              <button
                key={t.id}
                type="button"
                title={t.label}
                onClick={() => setIconType(t.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 text-xs transition-all ${
                  iconType === t.id
                    ? "border-foreground bg-accent font-medium"
                    : "border-transparent hover:border-muted-foreground/30 hover:bg-accent/50"
                }`}
              >
                <IconComp size={20} strokeWidth={2} />
                <span className="text-muted-foreground">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">لون الأيقونة</label>
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

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1">
          {editMarker ? "حفظ" : "إضافة"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
