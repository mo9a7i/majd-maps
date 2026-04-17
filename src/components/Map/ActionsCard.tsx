"use client";

import { Dispatch, SetStateAction } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import AddMarkerDialog from "@/components/Map/AddMarkerDialog";
import MarkerList from "@/components/Map/MarkerList";
import DrawModePanel from "@/components/Map/DrawModePanel";
import ImportDialog from "@/components/Map/ImportDialog";
import ExportMenu from "@/components/Map/ExportMenu";

export type Panel = "none" | "add-marker" | "marker-list" | "draw" | "import" | "export";

interface ActionsCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePanel: Panel;
  onActivePanelChange: Dispatch<SetStateAction<Panel>>;
  onFlyToMarker: (lat: number, lng: number) => void;
  pickingCoords: boolean;
  onStartPickingCoords: (onPick: (lat: number, lng: number) => void) => void;
}

const navItems: { id: Panel; label: string; icon: string }[] = [
  { id: "add-marker", label: "أضف علامة", icon: "📍" },
  { id: "marker-list", label: "قائمة العلامات", icon: "📋" },
  { id: "draw", label: "رسم خطوط / مضلعات", icon: "✏️" },
];

const dataItems: { id: Panel; label: string; icon: string }[] = [
  { id: "import", label: "استيراد ملف", icon: "📂" },
  { id: "export", label: "تصدير المشروع", icon: "💾" },
];

export default function ActionsCard({
  open,
  onOpenChange,
  activePanel,
  onActivePanelChange,
  onFlyToMarker,
  pickingCoords,
  onStartPickingCoords,
}: ActionsCardProps) {
  const toggle = (panel: Panel) =>
    onActivePanelChange((prev) => (prev === panel ? "none" : panel));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 sm:max-w-80 p-0 flex flex-col gap-0"
        showCloseButton
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle>الأدوات</SheetTitle>
          <SheetDescription>
            أضف علامات، ارسم، أو استورد وصدّر بياناتك.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {/* Navigation group */}
          <nav className="px-3 py-3 space-y-0.5">
            <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              الخريطة
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-right ${
                  activePanel === item.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </nav>

          <Separator />

          <nav className="px-3 py-3 space-y-0.5">
            <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              البيانات
            </p>
            {dataItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-right ${
                  activePanel === item.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Active panel content */}
          {activePanel !== "none" && (
            <>
              <Separator />
              <div className="px-5 py-4">
                {activePanel === "add-marker" && (
                  <AddMarkerDialog
                    pickingCoords={pickingCoords}
                    onStartPickingCoords={onStartPickingCoords}
                    onClose={() => onActivePanelChange("none")}
                  />
                )}
                {activePanel === "marker-list" && (
                  <MarkerList onFlyToMarker={onFlyToMarker} />
                )}
                {activePanel === "draw" && <DrawModePanel />}
                {activePanel === "import" && (
                  <ImportDialog onClose={() => onActivePanelChange("none")} />
                )}
                {activePanel === "export" && <ExportMenu />}
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
