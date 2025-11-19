declare global {
  interface ImportMeta {
    readonly env: {
      readonly PROD: boolean;
    };
  }

  interface Document {
    // `IE` does not support `Document.fonts`
    fonts?: FontFaceSet;
  }
}

export {};
