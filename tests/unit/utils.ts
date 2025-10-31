import { type CSSStyleDeclaration, type Document, Window } from 'happy-dom';
import { cloneDocument } from 'src/clone';
import { createContext, type Context } from 'src/context';

export function getStyle(doc: Document, selector: string, pseudoElt?: string) {
  const node = doc.querySelector(selector);
  if (!node) return {};
  const style = doc.defaultView!.getComputedStyle(node, pseudoElt);
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

export function clone(selector: string) {
  const context = createContext();
  context.bind(new Window().document);
  cloneDocument(context, document.querySelector(selector)!);
  context.mountStyle();
  return context as Omit<Context, 'document'> & { readonly document: Document };
}
