import { writeFile, readFile, access } from "fs/promises";
import { NewBook } from "./new-book.js";
import path from "path";
import matter from "gray-matter";

function createBookMatter(book: NewBook): string {
  const data = {
    dateAdded: book.dateAdded || null,
    dateStarted: book.dateStarted || null,
    dateFinished: book.dateFinished || null,
    dateAbandoned: book.dateAbandoned || null,
    title: book.title || null,
    authors: book.authors || [],
    publishedDate: book.publishedDate || null,
    categories: book.categories || [],
    pageCount: book.pageCount || null,
    format: book.format || null,
    thumbnail: book.thumbnail || null,
    language: book.language || null,
    link: book.link || null,
    identifier: book.identifier,
    identifiers: book.identifiers || {},
    status: book.status,
    rating: book.rating || null,
    tags: book.tags || [],
    image: book.image || null,
    duration: book.duration || null
  };

  return matter.stringify(book.notes || '', data);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeBookMarkdown(book: NewBook): Promise<void> {
  const markdownPath = path.join('_source', 'books', `${book.identifier}.md`);
  
  try {
    let content: string;
    
    if (await fileExists(markdownPath)) {
      const existingContent = await readFile(markdownPath, 'utf-8');
      const parsed = matter(existingContent);
      content = matter.stringify(parsed.content, book);
    } else {
      content = createBookMatter(book);
    }

    await writeFile(markdownPath, content);
  } catch (error) {
    throw new Error(`Failed to write markdown for book ${book.identifier}: ${error.message}`);
  }
}

export async function writeBookMarkdowns(bookMetadata: NewBook[]): Promise<void> {
  try {
    await Promise.all(bookMetadata.map(book => writeBookMarkdown(book)));
  } catch (error) {
    throw new Error(`Failed to write markdown files: ${error.message}`);
  }
}
