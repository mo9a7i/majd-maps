"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2, Plus } from "lucide-react";
import type { Marker } from "@/lib/types";
import { useProject } from "@/lib/ProjectContext";

// No built-in default items — user builds their own list

// ── Available template variables ──────────────────────────────────────────────
const AVAILABLE_VARS: { name: string; desc: string }[] = [
  { name: "company",               desc: "اسم الشركة المستقبلة" },
  { name: "employee",              desc: "اسم الموظف المرسل" },
  { name: "requesting_organization", desc: "اسم المنظمة الطالبة" },
  { name: "towers_list",           desc: "قائمة المواقع داخل الدائرة" },
  { name: "items_list",            desc: "قائمة البنود المطلوبة" },
];

// ── Default template sections ─────────────────────────────────────────────────
const DEFAULT_HEADER = "السادة / {{company}} المحترمين";

const DEFAULT_BODY =
  `نود التواصل معكم بخصوص المواقع التالية الواقعة ضمن نطاق اهتمامنا:
{{towers_list}}

ونطلب منكم تزويدنا بالبيانات التالية:
{{items_list}}

يرجى إرسال ما نحتاجه على العنوان التالي.`;

const DEFAULT_FOOTER = "تحياتي،\n{{employee}}\n{{requesting_organization}}";

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function buildEmail(
  header: string,
  body: string,
  footer: string,
  vars: Record<string, string>
): string {
  return [header, "", body, "", footer]
    .map((s) => renderTemplate(s, vars))
    .join("\n");
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  filteredMarkers: Marker[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EmailTemplateDialog({
  open,
  onClose,
  filteredMarkers,
}: EmailTemplateDialogProps) {
  const { state, setEmailTemplate } = useProject();

  // Initialise from context (or defaults) whenever the dialog opens
  const saved = state.emailTemplate;
  const [header, setHeader] = useState(saved?.header ?? DEFAULT_HEADER);
  const [body, setBody] = useState(saved?.body ?? DEFAULT_BODY);
  const [footer, setFooter] = useState(saved?.footer ?? DEFAULT_FOOTER);
  const [employeeName, setEmployeeName] = useState(saved?.employeeName ?? "");
  const [orgName, setOrgName] = useState(saved?.orgName ?? "");
  const [items, setItems] = useState<string[]>(saved?.items ?? []);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(saved?.selectedItems ?? [])
  );

  // Re-sync when the dialog opens (handles post-import refresh)
  useEffect(() => {
    if (!open) return;
    setHeader(saved?.header ?? DEFAULT_HEADER);
    setBody(saved?.body ?? DEFAULT_BODY);
    setFooter(saved?.footer ?? DEFAULT_FOOTER);
    setEmployeeName(saved?.employeeName ?? "");
    setOrgName(saved?.orgName ?? "");
    setItems(saved?.items ?? []);
    setSelectedItems(new Set(saved?.selectedItems ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Persist every change back to context
  useEffect(() => {
    setEmailTemplate({
      header, body, footer, employeeName, orgName, items,
      selectedItems: Array.from(selectedItems).sort(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, body, footer, employeeName, orgName, items, selectedItems]);

  // Copy state keyed by company
  const [copied, setCopied] = useState<string | null>(null);

  // Active company tab
  const [activeTab, setActiveTab] = useState(0);

  // ── Derived data ────────────────────────────────────────────────────────────
  const companiesMap = useMemo(() => {
    const map = new Map<string, Marker[]>();
    filteredMarkers.forEach((m) => {
      const key = m.company?.trim() || "بلا منظمة";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [filteredMarkers]);

  const companyTabs = useMemo(() => Array.from(companiesMap.keys()), [companiesMap]);

  // Clamp activeTab if companies list shrinks
  const safeTab = Math.min(activeTab, Math.max(0, companyTabs.length - 1));
  const activeCompany = companyTabs[safeTab] ?? "";

  const itemsList = useMemo(() => {
    const sorted = Array.from(selectedItems).sort((a, b) => a - b);
    return sorted
      .filter((i) => i < items.length)
      .map((i, idx) => `${idx + 1}- ${items[i]}`)
      .join("\n");
  }, [selectedItems, items]);

  const buildTowersList = useCallback(
    (company: string): string => {
      const markers = companiesMap.get(company) ?? [];
      return markers
        .map((m, i) =>
          `${i + 1}- ${m.label || "موقع بدون اسم"} (${m.lat.toFixed(5)}, ${m.lng.toFixed(5)})`
        )
        .join("\n");
    },
    [companiesMap]
  );

  const getVars = useCallback(
    (company: string): Record<string, string> => ({
      company,
      employee: employeeName || "اسم الموظف",
      requesting_organization: orgName || "اسم المنظمة",
      towers_list: buildTowersList(company),
      items_list: itemsList,
    }),
    [employeeName, orgName, buildTowersList, itemsList]
  );

  const emailText = activeCompany
    ? buildEmail(header, body, footer, getVars(activeCompany))
    : "";

  // ── Handlers ────────────────────────────────────────────────────────────────
  function toggleItem(idx: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(emailText);
    setCopied(activeCompany);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="min-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <h2 className="font-semibold text-base">قالب البريد الإلكتروني</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredMarkers.length} موقع داخل الدائرة
          </p>
        </div>

        {/* 3-column body — 1col on mobile/tablet, 1:2:2 on large+ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* ── Column 1 (1/5 lg): Items checklist ─────────────────────── */}
          <div className="col-span-1 flex flex-col border-b lg:border-b-0 border-l border-border lg:overflow-hidden">
            <p className="text-xs font-semibold px-4 pt-4 pb-2 text-muted-foreground uppercase tracking-wide">
              البنود المطلوبة
            </p>
            <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    لا توجد بنود بعد.
                    <br />أضف البنود التي تريد طلبها.
                  </p>
                  <button
                    onClick={() => setItems([""])}
                    className="flex items-center gap-1 text-xs text-blue-700 hover:underline mt-1"
                  >
                    <Plus size={13} /> أضف أول بند
                  </button>
                </div>
              ) : (
                <>
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`item-${i}`}
                        checked={selectedItems.has(i)}
                        onCheckedChange={() => toggleItem(i)}
                        className="shrink-0"
                      />
                      <Input
                        value={item}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = e.target.value;
                          setItems(next);
                        }}
                        className="h-7 text-xs flex-1 min-w-0"
                        placeholder="نص البند..."
                      />
                      <button
                        onClick={() => {
                          const next = items.filter((_, j) => j !== i);
                          setItems(next);
                          setSelectedItems((prev) => {
                            const s = new Set<number>();
                            prev.forEach((idx) => {
                              if (idx < i) s.add(idx);
                              else if (idx > i) s.add(idx - 1);
                            });
                            return s;
                          });
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="حذف البند"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setItems([...items, ""])}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                  >
                    <Plus size={13} /> إضافة بند
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Column 2 (2/5 lg): Template fields ─────────────────────── */}
          <div className="col-span-1 lg:col-span-2 flex flex-col border-b lg:border-b-0 border-l border-border lg:overflow-hidden">
            <p className="text-xs font-semibold px-4 pt-4 pb-2 text-muted-foreground uppercase tracking-wide">
              حقول القالب
            </p>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">رأس الرسالة</label>
                <Textarea
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">نص الرسالة</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ذيل الرسالة</label>
                <Textarea
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">اسم الموظف</label>
                  <Input
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="text-sm h-8"
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">اسم المنظمة</label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="text-sm h-8"
                    placeholder="اسم المنظمة"
                  />
                </div>
              </div>

              {/* Available variables */}
              <div className="border border-dashed border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">المتغيرات المتاحة</p>
                <div className="space-y-1.5">
                  {AVAILABLE_VARS.map((v) => (
                    <div key={v.name} className="flex items-start gap-2 text-xs">
                      <code
                        className="bg-muted px-1 py-0.5 rounded font-mono text-blue-700 dark:text-blue-400 shrink-0 cursor-pointer select-all"
                        title="انقر لنسخ"
                        onClick={() => navigator.clipboard.writeText(`{{${v.name}}}`)}
                      >
                        {`{{${v.name}}}`}
                      </code>
                      <span className="text-muted-foreground">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 3 (2/5 lg): Preview ─────────────────────────────── */}
          <div className="col-span-1 lg:col-span-2 flex flex-col lg:overflow-hidden">
            <p className="text-xs font-semibold px-4 pt-4 pb-2 text-muted-foreground uppercase tracking-wide">
              معاينة الرسالة
            </p>

            {/* Company tabs (only if multiple companies) */}
            {companyTabs.length > 1 && (
              <div className="flex gap-1.5 px-4 pb-3 flex-wrap">
                {companyTabs.map((company, i) => (
                  <button
                    key={company}
                    onClick={() => setActiveTab(i)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      safeTab === i
                        ? "bg-blue-950 text-white border-blue-950"
                        : "border-border text-muted-foreground hover:border-blue-950/50"
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            )}

            {/* Email preview */}
            <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 gap-3">
              <Textarea
                value={emailText}
                readOnly
                className="flex-1 min-h-0 text-sm font-mono resize-none bg-muted/30"
                dir="rtl"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="w-full gap-2 bg-blue-950 text-white hover:bg-blue-900"
              >
                {copied === activeCompany
                  ? <><Check size={14} /> تم النسخ</>
                  : <><Copy size={14} /> نسخ النص</>
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
