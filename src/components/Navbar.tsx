"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

interface NavbarProps {
  variant?: "landing" | "app";
  onSave?: () => void;
  onOpenSidebar?: () => void;
}

export default function Navbar({ variant = "landing", onSave, onOpenSidebar }: NavbarProps) {
  const isLanding = variant === "landing";
  return (
    <header
      className={`z-50 bg-background/80 backdrop-blur-md border-b border-border ${
        isLanding ? "fixed top-0 inset-x-0" : "relative shrink-0"
      }`}
    >
      <div className="container mx-auto h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          مجد مابس
        </Link>

        {variant === "landing" && (
          <Link href="/app">
            <Button className="text-md bg-blue-950 text-white cursor-pointer px-8 py-6 rounded-md">إبدأ</Button>
          </Link>
        )}

        {variant === "app" && (
          <div className="flex items-center gap-3">
            <Button className="text-lg bg-blue-950 text-white cursor-pointer px-8 py-6 rounded-md" onClick={onSave}>حفظ</Button>
            <Button size="lg" variant="outline" onClick={onOpenSidebar} className="gap-2 cursor-pointer">
              <MenuIcon className="size-4" />
              الأدوات
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

