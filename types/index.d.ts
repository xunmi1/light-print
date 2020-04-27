interface Options {
    documentTitle: string;
    mediaPrintStyle: string;
    zoom: number | string;
}
export declare type PrintOptions = Partial<Options>;
declare const lightPrint: <T extends string | Node = string>(target: T, options?: Partial<Options>) => Promise<void>;
export default lightPrint;
