import { getCollection } from "astro:content";

export interface BookBit {
  id: number;
  text: string;
  author: string;
  book: string;
  page: string;
}

export async function getMdxBookBits(): Promise<BookBit[]> {
  const bookBitsEntries = await getCollection("bookBits");
  if (!bookBitsEntries.length) {
    return [];
  }

  const bookBitsEntry = bookBitsEntries[0];

  const rawContent = bookBitsEntry.body;

  const bookSections = rawContent.split(/^## /m).slice(1);

  const bookBits: BookBit[] = [];
  let id = 1;

  for (const section of bookSections) {
    const bookTitleMatch = section.match(/^(.+?)$/m);
    if (!bookTitleMatch) continue;
    const bookTitle = bookTitleMatch[1].trim();

    const quoteBlocks = section.split(/\n---\n/);

    for (const block of quoteBlocks) {
      const quoteMatch = block.match(/>\s*([\s\S]*?)\s*>\s*-\s*(.+)$/m);

      if (quoteMatch) {
        const text = quoteMatch[1]
          .trim()
          .replace(/^>\s*/gm, "")
          .replace(/"\s*\n\s*>\s*"/g, "")
          .replace(/^"|"$/g, "");

        const pageInfo = quoteMatch[2].trim();

        let author = "";
        let bookName = bookTitle;

        if (bookTitle.includes("-")) {
          const parts = bookTitle.split("-").map((part: string) => part.trim());
          author = parts[0];
          bookName = parts.slice(1).join(" - ");
        }

        bookBits.push({
          id,
          text,
          author,
          book: bookName,
          page: pageInfo,
        });

        id++;
      }
    }
  }

  return bookBits;
}
