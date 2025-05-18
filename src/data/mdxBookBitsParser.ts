import { getCollection } from "astro:content";

export interface BookBit {
  id: number;
  text: string;
  author: string;
  book: string;
  page: string;
}

export async function getMdxBookBits(): Promise<BookBit[]> {
  // Get the bookBits collection entry
  const bookBitsEntries = await getCollection("bookBits");
  if (!bookBitsEntries.length) {
    return [];
  }

  // Get the first entry (assuming bitsfrombooks.mdx is the only file in the collection)
  const bookBitsEntry = bookBitsEntries[0];

  // Get the raw content
  const rawContent = bookBitsEntry.body;

  // Split by book sections (## Book Title)
  const bookSections = rawContent.split(/^## /m).slice(1); // Skip first section which is the title

  const bookBits: BookBit[] = [];
  let id = 1;

  // Process each book section
  for (const section of bookSections) {
    // Extract book title (first line)
    const bookTitleMatch = section.match(/^(.+?)$/m);
    if (!bookTitleMatch) continue;
    const bookTitle = bookTitleMatch[1].trim();

    // Split the section by horizontal rules (---) to get individual quotes
    const quoteBlocks = section.split(/\n---\n/);

    // Process each quote block
    for (const block of quoteBlocks) {
      // Extract the quote text and page information
      // This regex captures multiline quotes between > and > - Page X
      const quoteMatch = block.match(/>\s*([\s\S]*?)\s*>\s*-\s*(.+)$/m);
      
      if (quoteMatch) {
        // Extract quote text, preserve line breaks, and remove ">" from beginning of lines
        let text = quoteMatch[1]
          .trim()
          .replace(/^>\s*/gm, "") // Remove ">" from beginning of lines
          .replace(/"\s*\n\s*>\s*"/g, "") // Handle line breaks in the quote
          .replace(/^"|"$/g, ""); // Remove surrounding quotes

        // Extract page information
        const pageInfo = quoteMatch[2].trim();
        
        // Parse author from book title (Format is usually "Author - Book Title")
        let author = "";
        let bookName = bookTitle;
        
        if (bookTitle.includes("-")) {
          const parts = bookTitle.split("-").map(part => part.trim());
          author = parts[0];
          bookName = parts.slice(1).join(" - ");
        }

        bookBits.push({
          id,
          text,
          author,
          book: bookName,
          page: pageInfo
        });

        id++;
      }
    }
  }

  return bookBits;
} 