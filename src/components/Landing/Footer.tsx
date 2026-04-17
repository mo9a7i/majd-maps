import Link from "next/link";

const footerLinks = [
  { label: "معلومات تقنية", href: "/pages/technical" },
  { label: "الكود المصدري", href: "/pages/source-code" },
  { label: "السياسات", href: "/pages/policies" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          تم التطوير بواسطة{" "}
          <span className="font-medium text-foreground">6degrees technologies</span>
        </p>
        <nav className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
