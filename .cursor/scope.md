# Privacy-first Maps (Next.js + Leaflet + OpenStreetMap)

## Overview

Build a privacy-focused web app using **Next.js**, **Leaflet**, and **OpenStreetMap**. All user data (markers, labels, imports) lives **only in the browser (client-side memory)**. No backend storage, no database, no telemetry.

> Privacy note (accurate wording): **Your inputs stay in the browser**. However, **map tiles are loaded from OpenStreetMap** unless you self-host a tile server.

---

## Tech Stack

* Frontend: Next.js (App Router)
* Map: Leaflet
* UI: shadcn/ui
* Font: IBM Plex Sans Arabic (Google Fonts) — applied globally
* Data: In-memory state (optionally session-only)
* Import/Export: File-based (JSON / GeoJSON / KML)

---

## UX Flow

### Landing Page

* Navbar with small CTA button: **"إبدأ"**
* Hero with large image, rounded card, soft shadow
* Title (Arabic): **"خرائط تحترم خصوصيتك"**
* Subtitle (Arabic):

**"هذا التطبيق يحترم خصوصيتك، لا يستخدم قواعد بيانات، ولا يقوم بإرسال مدخلاتك. كل ما تقوم به داخل التطبيق يعيش في متصفحك وعلى جهازك فقط."**

* Feature cards below

### App View (after clicking "إبدأ")

* Fullscreen map
* Right-side **Actions Card**
* Navbar buttons:

  * **"حفظ"** (Export project)
  * **"إستيراد"** (Import files)

---

## Core Features (must-have)

### 1) Add Marker — "أضف علامة"

Dialog fields:

* **خط الطول** (Longitude)
* **خط العرض** (Latitude)
* **التسمية (اختيارية)**
* **لون العلامة**

Behavior:

* Single marker icon for MVP
* Marker appears immediately on the map

### 2) Pick Coordinates from Map

* Clicking on the map fills latitude/longitude automatically in the dialog
* Helper text (Arabic):

  * **"يمكنك الضغط على الخريطة لتحديد الإحداثيات تلقائياً."**

### 3) Marker List — "قائمة العلامات"

* List all markers (name, coordinates, color)
* Clicking an item pans/zooms to it

### 4) Edit Marker — "تعديل علامة"

* Edit name, color, coordinates

### 5) Delete Marker — "حذف علامة"

* Delete single marker
* Optional: multi-select later

### 6) Search Marker — "البحث عن علامة"

* Search by name
* Focus map on result

### 7) Import (day one includes GeoJSON)

Supported:

* **GeoJSON (required)**
* KML
* JSON

Buttons (Arabic):

* **"استيراد GeoJSON"**
* **"استيراد KML"**
* **"استيراد JSON"**

### 8) Export

* Export project as:

  * JSON (app format)
  * GeoJSON
  * KML (optional)

Navbar button:

* **"حفظ"**

### 9) Draw Tools — "رسم خطوط/مضلعات"

* Draw:

  * Line
  * Polygon
* Store locally with markers

### 10) Copy Coordinates — "نسخ الإحداثيات"

* Quick copy action per marker

---

## Session Behavior (Arabic copy)

**"عند إغلاق الصفحة، تنتهي جميع البيانات الموجودة فيها. إذا كنت بحاجة إلى الاستمرار لاحقاً، استخدم زر الحفظ لتنزيل ملف المشروع على جهازك، ثم قم باستيراده لاحقاً لإكمال العمل."**

---

## Privacy & Network Usage (Arabic copy)

**"هذا التطبيق لا يحتاج إلى تسجيل الدخول ولا يقوم بحفظ أي معلومات على خوادم تابعة له."**

**"جميع البيانات التي تقوم بإدخالها تتم معالجتها داخل المتصفح وعلى جهازك الشخصي فقط."**

**"يستخدم التطبيق الإنترنت فقط لتحميل الصفحة نفسها، وكذلك لتحميل أجزاء الخريطة من OpenStreetMap. مزود الخرائط قد يعلم أنه تم طلب أجزاء معينة من الخريطة، لكنه لا يرى العلامات أو البيانات التي تضيفها داخل التطبيق."**

---

## Footer

Links:

* **معلومات تقنية**
* **الكود المصدري**
* **السياسات**

Requirement:

* Load these pages from **Markdown files** in Next.js

Example structure:

* `/content/technical.md`
* `/content/source-code.md`
* `/content/policies.md`

Footer text:

* **"تم التطوير بواسطة 6degrees technologies"**

---

## Pages Structure

* `/` → Landing
* `/app` → Map UI
* `/technical` → Markdown page
* `/source-code` → Markdown page
* `/policies` → Markdown page

---

## State Shape (client-only)

```ts
interface Marker {
  id: string
  lat: number
  lng: number
  label?: string
  color: string
}

interface Project {
  version: string
  markers: Marker[]
  shapes: any[]
}
```

---

## MVP Scope (recommended)

* Landing page (Arabic content)
* Fullscreen map
* Add marker
* Pick coordinates by clicking map
* Marker list + edit + delete
* Import GeoJSON / KML / JSON
* Export project
* Basic draw tools
* Markdown-based footer pages
