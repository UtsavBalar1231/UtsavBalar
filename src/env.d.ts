/// <reference types="astro/client" />
declare module "astro:content" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const getCollection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const defineCollection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const z: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type CollectionEntry<_T> = any;
}
