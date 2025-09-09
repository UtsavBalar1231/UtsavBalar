export interface Social {
  icon: "github" | "linkedIn" | "twitter" | "email" | "xing" | "telegram" | "reddit" | "cat";
  link: string;
  title?: string;
  onClick?: string;
}

export const socials: Social[] = [
  {
    icon: "github",
    link: "https://github.com/UtsavBalar1231",
    title: "View GitHub Profile",
  },
  {
    icon: "linkedIn",
    link: "https://www.linkedin.com/in/utsavbalar",
    title: "View LinkedIn Profile",
  },
  {
    icon: "twitter",
    link: "https://x.com/UtsavTheCunt",
    title: "View Twitter Profile",
  },
  {
    icon: "telegram",
    link: "https://t.me/utsavthecunt",
    title: "Connect on Telegram",
  },
  {
    icon: "reddit",
    link: "https://www.reddit.com/user/utsavthecunt",
    title: "View Reddit Profile",
  },
  {
    icon: "email",
    link: "mailto:utsavbalar1231@gmail.com",
    title: "Send Email",
  },
  {
    icon: "cat",
    link: "#",
    title: "Get a new cat!",
    onClick: "refreshCatImage(); return false;",
  },
];
