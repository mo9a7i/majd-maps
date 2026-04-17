import {
  ShieldCheck,
  MonitorSmartphone,
  ServerOff,
  HardDrive,
  Code2,
  Zap,
} from "lucide-react";

export default function FeatureCards() {
  return (
    <section className="py-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <ShieldCheck className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 text-white" strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">خصوصية أولاً</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              تصميم التطبيق يضع خصوصيتك في المرتبة الأولى بلا تنازلات.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <MonitorSmartphone className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16  " strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">كل شيء داخل المتصفح</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              بياناتك لا تغادر جهازك. كل المعالجة تتم محلياً في متصفحك.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <ServerOff className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 " strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">لا توجد قاعدة بيانات</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              لا خوادم، لا قواعد بيانات، لا تخزين خارجي من أي نوع.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <HardDrive className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 " strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">حفظ محلي عند الحاجة</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              عند الحاجة، احفظ مشروعك كملف على جهازك واستورده لاحقاً.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-blue-950 to-blue-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white">
            <Code2 className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 " strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">مفتوح المصدر</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              الكود متاح للجميع للمراجعة والتحقق من وعودنا الأمنية.
            </p>
          </div>

          <div className="aspect-square flex flex-col justify-center items-center bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-gray-950">
            <Zap className="mb-4 h-7 w-7 md:h-12 md:w-12 lg:h-16 lg:w-16 " strokeWidth={1.75} />
            <h3 className="text-lg md:text-3xl font-semibold mb-2">بسيط وخفيف</h3>
            <p className="text-sm md:text-lg leading-relaxed">
              واجهة نظيفة وسريعة دون تضخيم أو تعقيد غير ضروري.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
