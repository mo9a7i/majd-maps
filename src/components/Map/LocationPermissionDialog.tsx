"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocationPermissionDialogProps {
  onLocated: (lat: number, lng: number) => void;
}

export default function LocationPermissionDialog({
  onLocated,
}: LocationPermissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open after a short delay so the map tiles have a chance to load first
  useEffect(() => {
    if (!navigator.geolocation) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  async function handleAllow() {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        setOpen(false);
        onLocated(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        setError("تعذّر الحصول على موقعك. تحقق من إعدادات المتصفح.");
      },
      { timeout: 10000 }
    );
  }

  function handleSkip() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
              📍
            </div>
            <DialogTitle>تحديد موقعك</DialogTitle>
          </div>
          <DialogDescription className="leading-relaxed space-y-2 pt-1">
            <span className="block">
              يمكن للتطبيق استخدام موقعك الحالي لتركيز الخريطة على منطقتك
              تلقائياً.
            </span>
            <span className="block text-xs bg-muted/60 rounded-lg px-3 py-2 text-muted-foreground">
              🔒 معلومات موقعك لن تُرسل إلى أي خادم. تُستخدم محلياً داخل
              المتصفح فقط لتحريك الخريطة، ولا يتم تخزينها بأي شكل.
            </span>
            {error && (
              <span className="block text-xs text-destructive">{error}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleSkip} disabled={loading} className="cursor-pointer">
            تخطي
          </Button>
          <Button onClick={handleAllow} disabled={loading} className="cursor-pointer bg-blue-950 text-white">
            {loading ? "جارٍ التحديد..." : "السماح"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
