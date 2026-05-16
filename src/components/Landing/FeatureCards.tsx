import {
  ShieldCheck,
  FileSpreadsheet,
  ServerOff,
  SlidersHorizontal,
  Mail,
  MapPin,
} from "lucide-react";

export default function FeatureCards() {
  return (
    <section className="py-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <ShieldCheck className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 text-white" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">خصوصية حقيقية</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              لا خوادم، لا قواعد بيانات، لا تتبع. بياناتك تعيش في متصفحك فقط.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <FileSpreadsheet className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">استيراد وتصدير XLSX</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              صدّر نقاطك وأشكالك وإعدادات القوالب في ملف إكسل واحد، واستورده لاحقاً بنقرة واحدة.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <ServerOff className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">بحث دائري تفاعلي</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              ارسم دائرة بحث بنطاق حر، احفظها، وشاهد العناصر الداخلة فيها مباشرة في القائمة.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <SlidersHorizontal className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">فلترة متعددة المستويات</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              فلتر بنوع العنصر والشركة ونوع الأيقونة — والخريطة تتزامن لتُخفي ما لا يطابق.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <Mail className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">قوالب البريد الإلكتروني</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              أنشئ قالب بريد بمتغيرات ديناميكية، ومعاينة فورية لكل شركة داخل نطاق البحث.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <MapPin className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">نقاط بأيقونات مخصصة</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              اختر أيقونة لكل نقطة (برج، كاميرا، سيارة، شخص) تُعرض بنفس الشكل على الخريطة وفي القائمة.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
