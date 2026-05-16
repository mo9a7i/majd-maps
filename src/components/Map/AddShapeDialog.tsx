"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/lib/ProjectContext";
import { MARKER_COLORS } from "@/lib/types";
import type { Shape } from "@/lib/types";

// Geometric-only shape data produced by Leaflet Draw before metadata is collected
export type DrawnShapeInit =
  | { type: "line"; points: [number, number][] }
  | { type: "polygon"; points: [number, number][] };

interface AddShapeDialogProps {
  /** New shape from Leaflet Draw (add flow) */
  shape?: DrawnShapeInit;
  /** Existing shape to edit (edit flow) */
  editShape?: Shape;
  onClose: () => void;
}

const DEFAULT_COLORS: Record<string, string> = {
  line: "#3b82f6",
  polygon: "#a855f7",
  circle: "#3b82f6",
};

const SHAPE_LABELS: Record<string, string> = {
  line: "خط",
  polygon: "مضلع",
  circle: "دائرة",
};

export default function AddShapeDialog({ shape, editShape, onClose }: AddShapeDialogProps) {
  const { addShape, editShape: saveEdit } = useProject();

  const shapeType = editShape?.type ?? shape?.type ?? "line";
  const initial = editShape;

  const [label, setLabel] = useState(initial?.label ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLORS[shapeType]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const labelVal = label.trim() || undefined;
    const companyVal = company.trim() || undefined;

    if (editShape) {
      saveEdit({ ...editShape, label: labelVal, company: companyVal, color });
    } else if (shape) {
      const meta = { label: labelVal, company: companyVal, color, dateAdded: now };
      if (shape.type === "line") {
        addShape({ type: "line", points: shape.points, ...meta });
      } else {
        addShape({ type: "polygon", points: shape.points, ...meta });
      }
    }
    onClose();
  }

  const isEditing = !!editShape;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-sm">
        {isEditing ? `تعديل ${SHAPE_LABELS[shapeType]}` : `إضافة ${SHAPE_LABELS[shapeType]}`}
      </h3>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">التسمية (اختيارية)</label>
        <Input
          type="text"
          placeholder="اسم العنصر"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-sm"
          autoFocus
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
        <label className="text-xs text-muted-foreground block">اللون</label>
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
          {isEditing ? "حفظ" : "إضافة"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
