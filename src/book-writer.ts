import { writeFile, readFile, access } from "fs/promises";
import { NewBook } from "./new-book.js";
import path from "path";
import matter from "gray-matter";

interface DataObject {
  [key: string]: unknown;
}

function sanitizeData(
  data: unknown,
): string | unknown[] | DataObject | unknown {
  if (data === null || data === undefined) return "";
  if (Array.isArray(data))
    return data.filter((item) => item !== null && item !== undefined);
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data as DataObject)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, sanitizeData(v)]),
    );
  }
  return data;
}

function createBookMatter(book: NewBook): string {
  const data = sanitizeData(book) as NewBook;
  return matter.stringify(book.notes || "", data);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeBookMarkdown(markdownPath: string, book: NewBook): Promise<void> {
  if (!book?.identifier) {
    throw new Error("Book identifier is required");
  }

  const slug =
    book.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || book.identifier;
  const markdownFilePath = path.join(markdownPath, `${slug}.md`);

  try {
    let content: string;

    if (await fileExists(markdownFilePath)) {
      const existingContent = await readFile(markdownFilePath, "utf-8");
      const parsed = matter(existingContent);
      content = matter.stringify(parsed.content, sanitizeData(book) as NewBook);
    } else {
      content = createBookMatter(book);
    }

    await writeFile(markdownFilePath, content);
  } catch (error) {
    throw new Error(
      `Failed to write markdown for book ${book.identifier}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export default async function returnWriteFile(
  fileName: string,
  bookMetadata: NewBook[],
): Promise<void> {
  try {
    await writeFile(fileName, JSON.stringify(bookMetadata, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to write JSON file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
