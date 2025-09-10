import { getCollection } from "astro:content";

export interface Quote {
  id: number;
  text: string;
  author: string;
}

export async function getMdxQuotes(): Promise<Quote[]> {
  const quotesEntries = await getCollection("quotes");
  if (!quotesEntries.length) {
    return [];
  }

  const quotesEntry = quotesEntries[0];

  const rawContent = quotesEntry.body;

  const quoteSections = rawContent.split(/\n---\n/).slice(1);

  const quotes: Quote[] = [];
  let id = 1;

  for (const section of quoteSections) {
    const quoteMatch = section.match(/>\s*([\s\S]*?)\s*-\s*\*\*([^*]+?)\*\*/);

    if (quoteMatch) {
      const text = quoteMatch[1]
        .trim()
        .replace(/^>\s*/gm, "")
        .replace(/"\s*\n\s*>\s*"/g, "")
        .replace(/^"|"$/g, "");

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
