"use client";

import type { Marker, Shape, CircleShape } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import MarkerList from "@/components/Map/MarkerList";

interface ActionsCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlyToMarker: (lat: number, lng: number) => void;
  onEditMarker: (marker: Marker) => void;
  onEditShape: (shape: Shape) => void;
  onHoverItem: (id: string | null) => void;
  filterIds?: string[];
  circleFilter?: CircleShape;
  mapCenter?: { lat: number; lng: number };
  onVisibleIdsChange?: (ids: Set<string> | null) => void;
}

export default function ActionsCard({
  open,
  onOpenChange,
  onFlyToMarker,
  onEditMarker,
  onEditShape,
  onHoverItem,
  filterIds,
  circleFilter,
  mapCenter,
  onVisibleIdsChange,
}: ActionsCardProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 sm:max-w-80 p-0 flex flex-col gap-0"
        showCloseButton
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle>قائمة العناصر</SheetTitle>
        </SheetHeader>

        {/* flex-1 + min-h-0 lets MarkerList fill remaining height and scroll internally */}
        <div className="flex-1 min-h-0 flex flex-col">
          <MarkerList
            onFlyToMarker={onFlyToMarker}
            onEditMarker={onEditMarker}
            onEditShape={onEditShape}
            onHoverItem={onHoverItem}
            filterIds={filterIds}
            circleFilter={circleFilter}
            mapCenter={mapCenter}
            onVisibleIdsChange={onVisibleIdsChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
