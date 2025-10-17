import type { CSSStyleDeclaration, Window } from 'happy-dom';

export function getStyle(contentWindow: Window, selector: string, pseudoElt?: string) {
  const node = contentWindow.document.querySelector(selector);
  if (!node) return {};
  const style = contentWindow.getComputedStyle(node, pseudoElt);
  return toStyleRecord(style);
}

/**
 * The `happy-dom`’s CSSStyleDeclaration implementation is incorrect
 * and fails to iterate over properties.
 */
function toStyleRecord(style: CSSStyleDeclaration) {
  return Object.fromEntries(
    getAllPropertyNames(style)
      .map<[string, string] | void>(key => {
        if (typeof key !== 'string' || isNumberLike(key)) return;
        const value = style[key];
        if (typeof value === 'string' && value) return [key, value];
      })
      .filter(v => v != null)
  );
}

function isNumberLike(value: string) {
  return /^[+-]?\d*\.?\d+$/.test(value);
}

function getAllPropertyNames<T extends object>(object: T) {
  const props = new Set<keyof T>();

  while (object && object !== Object.prototype) {
    Reflect.ownKeys(object).forEach(key => props.add(key as keyof T));
    object = Object.getPrototypeOf(object);
  }

  return Array.from(props);
}
