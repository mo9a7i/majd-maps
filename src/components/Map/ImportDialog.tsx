"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import { importGeoJSON, importKML, importProjectJSON } from "@/lib/importers";

type ImportType = "geojson" | "kml" | "json";

interface ImportDialogProps {
  onClose: () => void;
}

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const { importProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ImportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  function triggerImport(type: ImportType) {
    setPending(type);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === "geojson" ? ".geojson,.json" : type === "kml" ? ".kml,.xml" : ".json";
      fileInputRef.current.click();
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pending) return;
    try {
      const text = await file.text();
      let project;
      if (pending === "geojson") {
        project = importGeoJSON(JSON.parse(text));
      } else if (pending === "kml") {
        project = await importKML(text);
      } else {
        project = importProjectJSON(JSON.parse(text));
      }
      importProject(project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد.");
    } finally {
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">استيراد ملف</h3>
      <p className="text-xs text-muted-foreground">
        اختر نوع الملف الذي تريد استيراده. سيتم دمج البيانات مع الخريطة الحالية.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
      />

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => triggerImport("geojson")}
        >
          <span>📄</span> استيراد GeoJSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => triggerImport("kml")}
        >
          <span>🗺️</span> استيراد KML
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => triggerImport("json")}
        >
          <span>📁</span> استيراد JSON
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
        إلغاء
      </Button>
    </div>
  );
}
