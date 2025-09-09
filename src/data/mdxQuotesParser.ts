import { getCollection } from "astro:content";

export interface Quote {
  id: number;
  text: string;
  author: string;
}

export async function getMdxQuotes(): Promise<Quote[]> {
  // Get the quotes collection entry
  const quotesEntries = await getCollection("quotes");
  if (!quotesEntries.length) {
    return [];
  }

  // Get the first entry (assuming quotes.mdx is the only file in the collection)
  const quotesEntry = quotesEntries[0];

  // Get the raw content
  const rawContent = quotesEntry.body;

  // Split content by horizontal rules (---) which separate quotes
  const quoteSections = rawContent.split(/\n---\n/).slice(1); // Skip first section which is the title

  const quotes: Quote[] = [];
  let id = 1;

  // Process each quote section
  for (const section of quoteSections) {
    // Extract the quote text and author
    // This regex captures multiline quotes and preserves line breaks
    const quoteMatch = section.match(/>\s*([\s\S]*?)\s*-\s*\*\*([^*]+?)\*\*/);

    if (quoteMatch) {
      // Extract quote text, preserve line breaks, and remove ">" from beginning of lines
      const text = quoteMatch[1]
        .trim()
        .replace(/^>\s*/gm, "") // Remove ">" from beginning of lines
        .replace(/"\s*\n\s*>\s*"/g, "") // Handle line breaks in the quote
        .replace(/^"|"$/g, ""); // Remove surrounding quotes

      const author = quoteMatch[2].trim();

      quotes.push({
        id,
        text,
        author,
      });

      id++;
    }
  }

  return quotes;
}
