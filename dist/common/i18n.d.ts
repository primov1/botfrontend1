export type Lang = 'uz' | 'ru' | 'en';
export declare const LANGS: Lang[];
export declare const LANG_COOKIE = "admin_lang";
export declare function normalizeLang(code?: string | null): Lang;
export declare function tr(lang: Lang, key: string): string;
