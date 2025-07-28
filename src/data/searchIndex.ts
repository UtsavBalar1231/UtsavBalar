// Search Index for fuzzy searching content
export interface SearchItem {
  id: string;
  title: string;
  content: string;
  path: string;
  category: string;
  tabId: string;
  route: string;
  keywords: string[];
}

export const searchIndex: SearchItem[] = [
  {
    id: 'intro',
    title: 'About Me - Introduction',
    content: 'Utsav Balar embedded systems engineer Linux kernel development C++ Python embedded programming hardware software integration',
    path: 'about/intro.md',
    category: 'About',
    tabId: 'tab1',
    route: '#about',
    keywords: ['about', 'introduction', 'bio', 'profile', 'utsav', 'engineer', 'embedded', 'systems']
  },
  {
    id: 'projects',
    title: 'Projects Portfolio',
    content: 'software projects open source development GitHub repositories embedded systems Linux kernel modules device drivers C++ Python programming',
    path: 'projects/projects.md',
    category: 'Projects',
    tabId: 'tab2',
    route: '#projects',
    keywords: ['projects', 'portfolio', 'github', 'repositories', 'code', 'software', 'development']
  },
  {
    id: 'resume',
    title: 'Resume / CV',
    content: 'professional experience education skills work history career background embedded systems engineer software developer',
    path: 'resume/resume.pdf',
    category: 'Career',
    tabId: 'tab3',
    route: '#resume',
    keywords: ['resume', 'cv', 'experience', 'education', 'career', 'skills', 'work', 'history']
  },
  {
    id: 'quotes',
    title: 'Favorite Quotes',
    content: 'inspirational quotes wisdom philosophy motivation life lessons technology programming thoughts ideas',
    path: 'misc/quotes.md',
    category: 'Personal',
    tabId: 'tab4',
    route: '#quotes',
    keywords: ['quotes', 'inspiration', 'wisdom', 'philosophy', 'motivation', 'thoughts']
  },
  {
    id: 'bookbits',
    title: 'Book Bits & Excerpts',
    content: 'book excerpts reading notes technical books programming books system design literature technology insights',
    path: 'misc/book-bits.md',
    category: 'Learning',
    tabId: 'tab5',
    route: '#book-bits',
    keywords: ['books', 'reading', 'excerpts', 'notes', 'literature', 'learning', 'insights']
  },
  {
    id: 'tutorials',
    title: 'Linux Kernel Tutorials',
    content: 'Linux kernel development tutorials device drivers kernel modules embedded programming C programming system programming',
    path: 'tutorials/index.md',
    category: 'Education',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['tutorials', 'kernel', 'linux', 'drivers', 'modules', 'programming', 'education']
  },
  {
    id: 'tutorial-01',
    title: 'Introduction to Linux Kernel Modules',
    content: 'Linux kernel module development basics hello world kernel programming loadable modules init cleanup functions',
    path: 'tutorials/tutorial-01.md',
    category: 'Tutorial',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['kernel', 'modules', 'introduction', 'basics', 'hello', 'world', 'init', 'cleanup']
  },
  {
    id: 'tutorial-02',
    title: 'Character Device Drivers Fundamentals',
    content: 'character device drivers file operations major minor numbers device nodes proc filesystem user space kernel space',
    path: 'tutorials/tutorial-02.md',
    category: 'Tutorial',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['character', 'device', 'drivers', 'file', 'operations', 'major', 'minor', 'proc']
  },
  {
    id: 'tutorial-03',
    title: 'Kernel Memory Management for Drivers',
    content: 'kernel memory management kmalloc vmalloc DMA memory allocation virtual memory physical memory pages',
    path: 'tutorials/tutorial-03.md',
    category: 'Tutorial',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['memory', 'management', 'kmalloc', 'vmalloc', 'DMA', 'allocation', 'virtual', 'physical']
  },
  {
    id: 'tutorial-04',
    title: 'Synchronization Primitives',
    content: 'kernel synchronization spinlocks mutexes semaphores atomic operations critical sections race conditions',
    path: 'tutorials/tutorial-04.md',
    category: 'Tutorial',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['synchronization', 'spinlocks', 'mutexes', 'semaphores', 'atomic', 'race', 'conditions']
  },
  {
    id: 'tutorial-05',
    title: 'Interrupt Handling and Workqueues',
    content: 'interrupt handling IRQ handlers workqueues tasklets bottom halves top halves kernel threads',
    path: 'tutorials/tutorial-05.md',
    category: 'Tutorial',
    tabId: 'tab6',
    route: '#tutorials',
    keywords: ['interrupt', 'IRQ', 'handlers', 'workqueues', 'tasklets', 'bottom', 'halves', 'threads']
  }
];

// Fuzzy search algorithm
export class FuzzySearcher {
  private items: SearchItem[];

  constructor(items: SearchItem[]) {
    this.items = items;
  }

  search(query: string, limit: number = 10): SearchResult[] {
    if (!query.trim()) {
      return this.items.slice(0, limit).map((item, index) => ({
        item,
        score: 1,
        matches: []
      }));
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const item of this.items) {
      const score = this.calculateScore(item, normalizedQuery);
      if (score > 0) {
        results.push({
          item,
          score,
          matches: this.findMatches(item, normalizedQuery)
        });
      }
    }

    // Sort by score (descending) and take top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateScore(item: SearchItem, query: string): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    // Title matching (highest weight)
    const titleScore = this.calculateTextScore(item.title.toLowerCase(), query, queryWords);
    score += titleScore * 3;

    // Keywords matching (high weight)
    const keywordsText = item.keywords.join(' ').toLowerCase();
    const keywordsScore = this.calculateTextScore(keywordsText, query, queryWords);
    score += keywordsScore * 2;

    // Content matching (medium weight)
    const contentScore = this.calculateTextScore(item.content.toLowerCase(), query, queryWords);
    score += contentScore * 1;

    // Path matching (lower weight)
    const pathScore = this.calculateTextScore(item.path.toLowerCase(), query, queryWords);
    score += pathScore * 0.5;

    return score;
  }

  private calculateTextScore(text: string, fullQuery: string, queryWords: string[]): number {
    let score = 0;

    // Exact phrase match (highest score)
    if (text.includes(fullQuery)) {
      score += 10;
    }

    // Individual word matches
    for (const word of queryWords) {
      if (word.length < 2) continue;

      // Exact word match
      if (text.includes(word)) {
        score += 5;
      }

      // Fuzzy matching (partial word matches)
      const fuzzyScore = this.getFuzzyScore(text, word);
      score += fuzzyScore;
    }

    return score;
  }

  private getFuzzyScore(text: string, word: string): number {
    let score = 0;
    const words = text.split(/\s+/);

    for (const textWord of words) {
      if (textWord.length < 2) continue;

      // Substring match
      if (textWord.includes(word)) {
        score += 2;
      }
      
      // Starting with query word
      if (textWord.startsWith(word)) {
        score += 3;
      }

      // Levenshtein distance for fuzzy matching
      const distance = this.levenshteinDistance(word, textWord);
      const maxLen = Math.max(word.length, textWord.length);
      const similarity = 1 - (distance / maxLen);
      
      if (similarity > 0.6) {
        score += similarity * 2;
      }
    }

    return score;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private findMatches(item: SearchItem, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const queryWords = query.split(/\s+/);

    // Find matches in title
    for (const word of queryWords) {
      const titleIndex = item.title.toLowerCase().indexOf(word);
      if (titleIndex !== -1) {
        matches.push({
          field: 'title',
          start: titleIndex,
          end: titleIndex + word.length,
          text: word
        });
      }
    }

    // Find matches in keywords
    for (const keyword of item.keywords) {
      for (const word of queryWords) {
        if (keyword.toLowerCase().includes(word)) {
          matches.push({
            field: 'keywords',
            start: 0,
            end: keyword.length,
            text: keyword
          });
        }
      }
    }

    return matches;
  }
}

export interface SearchResult {
  item: SearchItem;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  start: number;
  end: number;
  text: string;
}

// Create global searcher instance
export const globalSearcher = new FuzzySearcher(searchIndex);