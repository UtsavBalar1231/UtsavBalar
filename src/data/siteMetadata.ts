export const baseURL = "https://utsavbalar.in";
export const ogImageUrl = "https://utsavbalar.in/img/meta.png";

export const authorPublisher = "Utsav Balar";
export const geoRegion = "IN-GJ";

export const seoTitle = "Utsav Balar | Embedded Linux & BSP Engineer";
export const seoDescription =
  "Embedded Linux and BSP Engineer with expertise in Linux kernel development, device drivers, and custom ROM development for various hardware platforms.";
export const seoKeywords =
  "Utsav Balar, Embedded Linux, BSP Engineer, Linux Kernel, Device Drivers, Custom ROM, Vicharak, Rockchip, Qualcomm";

export const twitter = {
  title: seoTitle,
  description: seoDescription,
  image: ogImageUrl,
  site: "https://x.com/UtsavTheCunt",
  creator: "UtsavTheCunt",
};

export const openGraph = {
  title: seoTitle,
  description: seoDescription,
  url: baseURL,
  image: ogImageUrl,
  type: "website",
  locale: "en_US",
  siteName: "Utsav Balar",
};

export const dublinCore = {
  title: "Utsav Balar",
  creator: authorPublisher,
  publisher: authorPublisher,
  rights: authorPublisher,
  description: seoDescription,
  language: "en",
  type: "Software",
  format: "text/html",
};

export const inlineFavicon = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="transparent" />
  <text x="16" y="21" fill="currentColor" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">UB</text>
</svg>
`;
