/**
 * Parses a comma-separated consUsed string into tokens, merging adjacent parts
 * when they form one of the allowed consumables that contain commas:
 * - "omaya resevoir, ventricular stent"
 * - "csf drainage system, otherwise than vp, lp and evd"
 */
export function parseConsUsedTokens(value: string): string[] {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const tokens: string[] = [];
  const TWO_PART = "omaya resevoir, ventricular stent";
  const THREE_PART = "csf drainage system, otherwise than vp, lp and evd";
  let i = 0;
  while (i < parts.length) {
    if (i + 2 < parts.length) {
      const three = `${parts[i]}, ${parts[i + 1]}, ${parts[i + 2]}`;
      if (three.toLowerCase() === THREE_PART) {
        tokens.push(three);
        i += 3;
        continue;
      }
    }
    if (i + 1 < parts.length) {
      const two = `${parts[i]}, ${parts[i + 1]}`;
      if (two.toLowerCase() === TWO_PART) {
        tokens.push(two);
        i += 2;
        continue;
      }
    }
    tokens.push(parts[i]);
    i += 1;
  }
  return tokens;
}

/**
 * Returns true if value is a valid consUsed string: after parsing (with
 * merge of comma-containing consumables), every token is in the allowed list.
 */
export function isValidConsUsed(value: string, allowedList: readonly string[]): boolean {
  const tokens = parseConsUsedTokens(value);
  if (tokens.length === 0) return false;
  const allowedSet = new Set(allowedList.map((s) => s.toLowerCase()));
  return tokens.every((t) => allowedSet.has(t.trim().toLowerCase()));
}
