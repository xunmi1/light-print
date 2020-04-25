interface Options {
    documentTitle: string;
    mediaPrintStyle: string;
    zoom: number | string;
}
export declare type PrintOptions = Partial<Options>;
declare const print: <T extends Node>(target: T, options?: Partial<Options>) => Promise<unknown>;
export default print;
