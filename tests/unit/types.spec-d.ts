import { test, expectTypeOf } from 'vitest';
import lightPrint from '/src';

test('parameters', () => {
  expectTypeOf(lightPrint).toBeFunction();
  expectTypeOf(lightPrint).parameter(0).toEqualTypeOf<string | Element>();
  expectTypeOf(lightPrint).parameter(1).toEqualTypeOf<
    | {
        documentTitle?: string;
        mediaPrintStyle?: string;
        zoom?: number | string;
      }
    | undefined
  >();
  expectTypeOf(lightPrint).parameter(2).toEqualTypeOf<undefined>();
});

test('returns', () => {
  expectTypeOf(lightPrint).returns.toEqualTypeOf<Promise<void>>();
});
