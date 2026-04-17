"use client";

import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";

export default function DrawModePanel() {
  const { state, deleteShape } = useProject();

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">رسم خطوط / مضلعات</h3>
      <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed space-y-1">
        <p>استخدم أدوات الرسم الظاهرة على الخريطة:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>انقر على الخريطة لإضافة نقاط</li>
          <li>انقر مرتين لإنهاء الرسم</li>
          <li>اختر رسم خط أو مضلع من شريط الأدوات</li>
        </ul>
      </div>

      {state.shapes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            الأشكال المرسومة ({state.shapes.length})
          </p>
          {state.shapes.map((shape) => (
            <div
              key={shape.id}
              className="flex items-center justify-between border border-border rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ background: shape.color }}
                />
                <span className="text-xs">
                  {shape.type === "line" ? "خط" : "مضلع"}
                  {shape.label ? ` — ${shape.label}` : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => deleteShape(shape.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {state.shapes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          لم يتم رسم أي أشكال بعد.
        </p>
      )}
    </div>
  );
}
