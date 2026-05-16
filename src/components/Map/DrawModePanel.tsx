"use client";

export default function DrawModePanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">أدوات الرسم</h3>
      <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed space-y-1">
        <p>استخدم أدوات الرسم الظاهرة على الخريطة:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>اختر رسم خط أو مضلع من شريط الأدوات</li>
          <li>انقر على الخريطة لإضافة نقاط</li>
          <li>انقر مرتين لإنهاء الرسم</li>
        </ul>
        <p className="mt-2">الأشكال المرسومة تظهر في <strong>قائمة العناصر</strong>.</p>
      </div>
    </div>
  );
}
