#!/usr/bin/env node
/**
 * XML 1.0 has no way to carry a NUL or most other C0 controls, and Word refuses a file
 * that contains one. Everything user-supplied is cleaned before it reaches document.xml
 * and the count of removed code points is reported back in the tool's answer.
 */
/**
 * A client that escaped its own JSON sends the two characters backslash-n where it meant a
 * line break, and the escape used to reach the printed page. Turn those into real breaks and
 * collapse stray whitespace before anything is rendered.
 */
export declare function normalizeText(s: string): string;
