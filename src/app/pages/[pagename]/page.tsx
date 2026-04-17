import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { getMarkdownContent } from "@/lib/markdown";
import MarkdownPage from "@/components/MarkdownPage";

interface Props {
  params: Promise<{ pagename: string }>;
}

/** All .md files in /content are valid page slugs */
export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src", "content");
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  return files.map((f) => ({ pagename: f.replace(/\.md$/, "") }));
}

export default async function DynamicPage({ params }: Props) {
  const { pagename } = await params;
  const filename = `${pagename}.md`;
  const filePath = path.join(process.cwd(), "src", "content", filename);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const { title, contentHtml } = await getMarkdownContent(filename);
  return <MarkdownPage title={title} contentHtml={contentHtml} />;
}
