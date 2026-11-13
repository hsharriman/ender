/// <reference types="vite/client" />

/** Digest of the verified checker bundle; set by `define` in vite.config.ts. */
declare const __GHOST_CHECKER_VERSION__: string;

declare module "*.txt" {
  const url: string;
  export default url;
}
