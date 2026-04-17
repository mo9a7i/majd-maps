import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <section className="bg-white py-20">
            <div
                className="container bg-cover bg-center text-white rounded-2xl overflow-hidden mx-auto text-center p-10 py-32 relative"
                style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/dark_map.png)` }}
            >
                <div className="absolute inset-0 bg-linear-to-br from-blue-950 to-blue-800 opacity-30"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">خرائط تحترم خصوصيتك</h1>
                    <p className="text-base md:text-2xl leading-relaxed mb-8 max-w-3xl mx-auto">هذا التطبيق يحترم خصوصيتك، لا يستخدم قواعد بيانات، ولا يقوم بإرسال مدخلاتك. كل ما تقوم به داخل التطبيق يعيش في متصفحك وعلى جهازك فقط.</p>
                    <Link href="/app">
                        <Button size="lg" className="text-lg bg-white text-gray-900 px-12 py-6 rounded-md">
                            إبدأ الآن
                        </Button>
                    </Link>
                    <p className="mt-6 text-sm ">لا يلزم تسجيل دخول · لا تتبع · لا بيانات تُرسل</p>
                </div>
            </div>
        </section>
    );
}
