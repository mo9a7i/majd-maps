"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/ProjectContext";
import { importXLSX } from "@/lib/importers";

interface ImportDialogProps {
  onClose: () => void;
  autoTrigger?: boolean;
}

export default function ImportDialog({ onClose, autoTrigger }: ImportDialogProps) {
  const { importProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoTrigger) {
      // Small delay so the sheet/DOM is ready before triggering the picker
      const t = setTimeout(() => fileInputRef.current?.click(), 80);
      return () => clearTimeout(t);
    }
  }, [autoTrigger]);

  function triggerImport() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      // User dismissed picker without selecting — close the sheet
      if (autoTrigger && !error) onClose();
      return;
    }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const project = await importXLSX(buffer);
      importProject(project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      {loading && (
        <p className="text-sm text-muted-foreground text-center py-2">جارٍ الاستيراد...</p>
      )}

      {error && (
        <>
          <h3 className="font-semibold text-sm">خطأ في الاستيراد</h3>
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={triggerImport}>
            <span>📊</span> حاول مرة أخرى
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
            إلغاء
          </Button>
        </>
      )}
    </div>
  );
}
