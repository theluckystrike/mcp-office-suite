#!/usr/bin/env node
/**
 * The built-in fonts of a PDF carry WinAnsi, which has 256 code points and no way to
 * hold an em dash typed as U+2014 or any CJK character. Text that reaches a stamp is
 * cleaned first and the count of removed characters is reported, rather than handing
 * back a file that failed to write halfway.
 */
export declare function sanitizeStampText(s: string): {
    text: string;
    removed: number;
    transliterated: number;
};
