import { writeFile, readFile, access } from "fs/promises";
import { NewBook } from "./new-book.js";
import path from "path";
import matter from "gray-matter";

function sanitizeData(data: any): any {
  if (data === null || data === undefined) return '';
  if (Array.isArray(data)) return data.filter(item => item !== null && item !== undefined);
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return data;
}

function createBookMatter(book: NewBook): string {
  const data = sanitizeData({
    dateAdded: book.dateAdded,
    dateStarted: book.dateStarted,
    dateFinished: book.dateFinished,
    dateAbandoned: book.dateAbandoned,
    title: book.title,
    authors: book.authors,
    publishedDate: book.publishedDate,
    categories: book.categories,
    pageCount: book.pageCount,
    format: book.format,
    thumbnail: book.thumbnail,
    language: book.language,
    link: book.link,
    identifier: book.identifier,
    identifiers: book.identifiers,
    status: book.status,
    rating: book.rating,
    tags: book.tags,
    image: book.image,
    duration: book.duration
  });

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
  // if (!book?.identifier) {
  //   throw new Error('Book identifier is required');
  // }

  console.log(JSON.stringify(book))

  // const markdownPath = path.join('_source', 'books', `${book.identifier}.md`);
  const markdownPath = path.join(`${book.identifier}.md`);
  
  try {
    let content: string;
    
    if (await fileExists(markdownPath)) {
      const existingContent = await readFile(markdownPath, 'utf-8');
      const parsed = matter(existingContent);
      content = matter.stringify(parsed.content, sanitizeData(book));
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
