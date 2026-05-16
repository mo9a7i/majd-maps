# الكود المصدري

## الشفافية كمبدأ

نؤمن بأن الثقة يجب أن تُبنى على الشفافية وليس على الوعود. لهذا السبب، رصد مشروع مفتوح المصدر بالكامل.

## ماذا يعني هذا؟

- يمكنك الاطلاع على كل سطر من كود التطبيق
- يمكنك التحقق بنفسك من أننا لا نرسل بياناتك لأي جهة
- يمكنك نسخ المشروع وتشغيله بشكل مستقل على جهازك أو خادمك
- يمكنك المساهمة في تحسين التطبيق

## البنية التقنية

التطبيق مبني بالكامل على التقنيات التالية، وجميعها مفتوحة المصدر:

- **Next.js** — MIT License
- **Leaflet + leaflet-draw** — BSD 2-Clause License
- **OpenStreetMap** — ODbL License
- **SheetJS (xlsx)** — Apache-2.0 License
- **shadcn/ui** — MIT License
- **Tailwind CSS** — MIT License
- **Lucide React** — ISC License

## رابط المستودع

[github.com/mo9a7i/majd-maps](https://github.com/mo9a7i/majd-maps)

## كيف تشغله محلياً؟

```bash
git clone https://github.com/mo9a7i/majd-maps
cd majd-maps
pnpm install
pnpm dev
```

ثم افتح `http://localhost:3000` في المتصفح.

## هيكل الملفات الرئيسية

```
src/
├── app/                    # صفحات Next.js
│   ├── app/page.tsx        # صفحة التطبيق الرئيسية
│   └── page.tsx            # الصفحة التمهيدية
├── components/
│   ├── Landing/            # مكونات الصفحة التمهيدية
│   └── Map/
│       ├── MapView.tsx         # المنسق الرئيسي للخريطة
│       ├── MapCanvas.tsx       # رسم Leaflet وإدارة الطبقات
│       ├── MarkerList.tsx      # القائمة الجانبية الموحدة مع الفلاتر
│       ├── ActionsCard.tsx     # الورقة الجانبية للقائمة
│       ├── AddMarkerDialog.tsx # نموذج إضافة/تعديل نقطة
│       ├── AddShapeDialog.tsx  # نموذج إضافة/تعديل شكل
│       └── EmailTemplateDialog.tsx # نافذة قوالب البريد
├── lib/
│   ├── types.ts            # تعريفات TypeScript (Marker, Shape, EmailTemplate...)
│   ├── ProjectContext.tsx  # الحالة العامة (markers, shapes, emailTemplate)
│   ├── exporters.ts        # تصدير XLSX / GeoJSON / KML
│   └── importers.ts        # استيراد XLSX / GeoJSON / KML
```

## المساهمة

نرحب بأي مساهمة، سواء كانت تقريراً عن خطأ، أو اقتراح ميزة، أو تحسين في الكود. تواصل معنا عبر قسم [Issues](https://github.com/mo9a7i/majd-maps/issues) في المستودع.

---

*رصد — شفافية كاملة، خصوصية حقيقية.*
