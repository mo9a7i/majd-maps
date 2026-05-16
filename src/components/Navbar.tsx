"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuIcon, Plus, MapPin, PenLine } from "lucide-react";

interface NavbarProps {
  variant?: "landing" | "app";
  onSave?: () => void;
  onImport?: () => void;
  onOpenSidebar?: () => void;
  onAddMarker?: () => void;
  onOpenDraw?: () => void;
}

export default function Navbar({
  variant = "landing",
  onSave,
  onImport,
  onOpenSidebar,
  onAddMarker,
  onOpenDraw,
}: NavbarProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addMenuOpen]);

  return (
    <header
      className={`z-50 bg-background border-b border-border ${
        variant === "landing" ? "fixed top-0 inset-x-0 px-3 md:px-0" : "relative shrink-0"
      }`}
    >
      <div className="container mx-auto h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          رصد
        </Link>

        {variant === "landing" && (
          <Link href="/app">
            <Button className="text-md bg-blue-950 text-white cursor-pointer px-8 py-6 rounded-md">إبدأ</Button>
          </Link>
        )}

        {variant === "app" && (
          <div className="flex items-center gap-3">
            {/* + Add dropdown */}
            <div className="relative" ref={menuRef}>
              <Button
                className="cursor-pointer px-4 py-6 rounded-md bg-blue-950 text-white hover:bg-blue-900"
                onClick={() => setAddMenuOpen((p) => !p)}
                aria-label="إضافة"
              >
                <Plus className="size-5" />
              </Button>

              {addMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      setAddMenuOpen(false);
                      onAddMarker?.();
                    }}
                  >
                    <MapPin size={15} />
                    إضافة نقطة
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      setAddMenuOpen(false);
                      onOpenDraw?.();
                    }}
                  >
                    <PenLine size={15} />
                    رسم خط / مضلع
                  </button>
                </div>
              )}
            </div>

            <Button
              className="text-lg bg-blue-950/10 text-blue-950 border border-blue-950/20 cursor-pointer px-8 py-6 rounded-md hover:bg-blue-950/20"
              onClick={onImport}
            >
              استيراد
            </Button>
            <Button
              className="text-lg bg-blue-950 text-white cursor-pointer px-8 py-6 rounded-md"
              onClick={onSave}
            >
              حفظ
            </Button>
            <Button className="cursor-pointer px-4 py-6 rounded-md" variant="outline" onClick={onOpenSidebar}>
              <MenuIcon className="size-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
