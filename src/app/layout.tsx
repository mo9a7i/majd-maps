import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction"

import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const BASE_URL = "https://mo9a7i.github.io/majd-maps";
const OG_IMAGE = `${BASE_URL}/dark_map.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "رصد — خرائط تحترم خصوصيتك",
    template: "%s | رصد",
  },
  description:
    "تطبيق رصد للخرائط — مفتوح المصدر يحترم خصوصيتك. لا قواعد بيانات، لا تتبع، لا إرسال بيانات — كل شيء يبقى داخل متصفحك.",
  keywords: ["رصد", "خرائط", "خصوصية", "مفتوح المصدر", "maps", "privacy", "open source"],
  authors: [{ name: "6 degrees technologies" }],
  creator: "6 degrees technologies",

  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "رصد",
    title: "رصد — خرائط تحترم خصوصيتك",
    description:
      "تطبيق رصد للخرائط — مفتوح المصدر يحترم خصوصيتك. لا قواعد بيانات، لا تتبع، لا إرسال بيانات — كل شيء يبقى داخل متصفحك.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "رصد — خريطة تفاعلية تحترم خصوصيتك",
      },
    ],
    locale: "ar_SA",
  },

  twitter: {
    card: "summary_large_image",
    title: "رصد — خرائط تحترم خصوصيتك",
    description:
      "تطبيق رصد للخرائط — مفتوح المصدر يحترم خصوصيتك. لا قواعد بيانات، لا تتبع، لا إرسال بيانات — كل شيء يبقى داخل متصفحك.",
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <body className="px-3 md:px-0 min-h-fu  ll flex flex-col font-[family-name:var(--font-ibm-plex-arabic)]">
      <DirectionProvider direction="rtl">{children}</DirectionProvider>
      </body>
    </html>
  );
}
