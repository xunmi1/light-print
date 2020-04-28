export declare const isIE: () => boolean;
export declare const isNode: (target: unknown) => target is Node;
export declare const appendNode: <T extends Node>(parent: T, child: T) => T;
export declare const importNode: <T extends Node>(document: Document, node: T) => T;
export declare const removeNode: <T extends Node>(node: T) => T | undefined;
export declare const cloneStyle: <T extends Element>(target: T, origin: T) => void;
export declare const setProperty: <T extends ElementCSSInlineStyle>(target: T, propertyName: string, value: string | number, priority?: string | null | undefined) => void;
