"use client";

import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import { exportJSON, exportGeoJSON, exportKML } from "@/lib/exporters";

export default function ExportMenu() {
  const { exportProject } = useProject();

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">تصدير المشروع</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        عند إغلاق الصفحة، تنتهي جميع البيانات الموجودة فيها. إذا كنت بحاجة إلى
        الاستمرار لاحقاً، استخدم زر الحفظ لتنزيل ملف المشروع على جهازك، ثم قم
        باستيراده لاحقاً لإكمال العمل.
      </p>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => exportJSON(exportProject())}
        >
          <span>📄</span> حفظ كـ JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => exportGeoJSON(exportProject())}
        >
          <span>🗺️</span> حفظ كـ GeoJSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => exportKML(exportProject())}
        >
          <span>📍</span> حفظ كـ KML
        </Button>
      </div>
    </div>
  );
}
