export interface NavLink {
  href: string;
  text: string;
  desktopColor: string;
  mobileIcon: string;
  mobileText: string;
  filePath: string;
}

export const navigation: readonly NavLink[] = [
  {
    href: "/",
    text: "Home",
    desktopColor: "term-bright-green",
    mobileIcon: "~",
    mobileText: "Home",
    filePath: "~/index.html",
  },
  {
    href: "/about/",
    text: "About",
    desktopColor: "term-bright-cyan",
    mobileIcon: "&",
    mobileText: "About",
    filePath: "~/about.html",
  },
  {
    href: "/projects/",
    text: "Projects",
    desktopColor: "term-bright-yellow",
    mobileIcon: ">",
    mobileText: "Projects",
    filePath: "~/projects.html",
  },
  {
    href: "/quotes/",
    text: "Quotes",
    desktopColor: "term-bright-blue",
    mobileIcon: "%",
    mobileText: "Quotes",
    filePath: "~/quotes.html",
  },
  {
    href: "/bookbits/",
    text: "Bits",
    desktopColor: "term-bright-magenta",
    mobileIcon: "$",
    mobileText: "Bits",
    filePath: "~/bookbits.html",
  },
  {
    href: "/resume/",
    text: "Resume",
    desktopColor: "term-bright-red",
    mobileIcon: "@",
    mobileText: "Resume",
    filePath: "~/resume.html",
  },
  {
    href: "/tutorials/",
    text: "Tutorials",
    desktopColor: "term-bright-yellow",
    mobileIcon: "#",
    mobileText: "Learn",
    filePath: "~/tutorials.html",
  },
] as const;

export function getFilePathForRoute(pathname: string): string {
  const link = navigation.find((l) => l.href === pathname);
  return link ? link.filePath : "~" + pathname.replace(/\/$/, "") + ".html";
}
