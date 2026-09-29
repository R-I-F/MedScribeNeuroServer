/**
 * Arabic text corrections for pdfkit output.
 *
 * pdfkit (through fontkit) shapes Arabic and orders it right to left correctly with an Arabic
 * capable font, and with assets/fonts/Cairo-Regular.ttf it also keeps embedded Latin and digit runs
 * in the correct order on its own. Two spacing defects remain, and BOTH were established by
 * rendering probe pages and reading the pixels, not by reasoning about the engine:
 *
 *   1. The trailing space of a single-line right-to-left run is swallowed, so a two word title
 *      renders fused ("جراحة الأطفال" came out "الأطفالجراحة"). Appending a space fixes it.
 *   2. A single space between Arabic and a following Latin or digit run is also swallowed
 *      ("دون 18" renders "دون18"). Three spaces survive as a normal looking gap.
 *
 * Deliberately NOT done here, each rejected on rendered evidence:
 *   - Pre-reversing Latin/digit clusters. With this font pdfkit already orders them correctly, so
 *     pre-reversing CORRUPTS them: a timestamp came out as "50:28:17 29-09-2026".
 *   - Using a non-breaking space to protect the gap. It fixes the spacing but fuses the two runs
 *     into one right-to-left run, which REVERSES the digits: 18 renders as 81 and 2026-09-29 as
 *     92-90-6202. Wrong numbers in a statistics report are far worse than a tight space.
 *   - Bidi control characters. LRM, LRE and LRO change nothing; LRI/PDI inject tofu glyphs.
 *
 * Note these findings are font-specific: an earlier session using arial.ttf did need the cluster
 * pre-reversal. Re-probe before reusing this with a different Arabic font.
 */

export const ARABIC_REGEX = /[؀-ۿ]/;

/**
 * The gap that survives shaping at an Arabic to Latin boundary. Two spaces still fused in testing;
 * three render as a single normal gap.
 */
const BOUNDARY_GAP = "   ";

/** True when the string contains any Arabic letter and therefore needs the corrections. */
export function hasArabic(s: string | null | undefined): boolean {
  return !!s && ARABIC_REGEX.test(s);
}

/**
 * Widens the space between Arabic and a following Latin or digit run. Punctuation that trails the
 * Arabic (a colon, comma or full stop) is treated as part of the Arabic side, so "الإنشاء: 2026"
 * is covered too.
 */
function widenBoundaries(s: string): string {
  return s.replace(/([؀-ۿ][^\sA-Za-z0-9؀-ۿ]*)[ \t]+(?=[A-Za-z0-9])/g,
    (_m, lead) => `${lead}${BOUNDARY_GAP}`);
}

/**
 * Prepares an Arabic (or mixed) string for a single-line pdfkit `text()` call.
 * Returns non-Arabic input untouched, so it is safe to call on every label.
 */
export function arabicLine(input: string | null | undefined): string {
  if (input == null) return "";
  const s = String(input);
  if (!ARABIC_REGEX.test(s)) return s;
  return `${widenBoundaries(s)} `;
}

/**
 * For a wrapped multi-line paragraph. The trailing-space fix does not apply (pdfkit keeps interior
 * spaces when it wraps), but the boundary widening still does.
 */
export function arabicParagraph(input: string | null | undefined): string {
  if (input == null) return "";
  const s = String(input);
  if (!ARABIC_REGEX.test(s)) return s;
  return widenBoundaries(s);
}
