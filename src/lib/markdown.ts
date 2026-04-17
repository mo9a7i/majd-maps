import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export async function getMarkdownContent(filename: string): Promise<{
  title: string;
  contentHtml: string;
}> {
  const filePath = path.join(process.cwd(), "src", "content", filename);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processed = await remark().use(remarkHtml, { sanitize: false }).process(content);
  let contentHtml = processed.toString();

  // Extract title from frontmatter, or pull the first <h1> out of the HTML
  let title = (data.title as string) ?? "";
  if (!title) {
    const h1Match = contentHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      // Strip HTML tags from the matched heading text
      title = h1Match[1].replace(/<[^>]+>/g, "");
      // Remove the first h1 from the body so the layout header doesn't duplicate it
      contentHtml = contentHtml.replace(h1Match[0], "");
    }
  }

  return { title, contentHtml };
}
