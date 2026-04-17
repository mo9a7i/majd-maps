import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Landing/Footer";
import { ChevronRightIcon } from "lucide-react";

interface MarkdownPageProps {
  contentHtml: string;
  /** Extracted from the first h1 in the markdown */
  title?: string;
}

export default function MarkdownPage({ contentHtml, title }: MarkdownPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="landing" />

      <main className="flex-1 mt-14">
        <section className="py-12 container mx-auto">
            {title && (
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
            )}
          <article
              className="text-lg
                prose prose-neutral max-w-none py-12
                prose-headings:font-semibold prose-headings:mt-10 prose-headings:tracking-tight prose-headings:text-foreground
                prose-h1:text-xl 
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-0
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-0
                prose-p:text-muted-foreground prose-p:leading-7 prose-p:mb-0 
                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-li:text-muted-foreground prose-li:leading-7 prose-li:mb-0 
                prose-ul:my-4 prose-ol:my-4 prose-ul:mb-0 prose-ol:mb-0
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:text-sm
                prose-hr:border-border
              "
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
        </section>

      </main>

      <Footer />
    </div>
  );
}
