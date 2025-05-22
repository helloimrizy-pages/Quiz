/// <reference types="vite/client" />

declare global {
  interface Window {
    fs: {
      readFile: (
        path: string,
        options?: { encoding?: string }
      ) => Promise<string | Uint8Array>;
    };
  }
}
