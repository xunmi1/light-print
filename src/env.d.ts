declare global {
  interface ImportMeta {
    readonly env: {
      readonly PROD: boolean;
    };
  }
}

export {};
