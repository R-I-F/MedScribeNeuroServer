/**
 * Canonical forms for person data, applied on every write (stage N1 of
 * docs/DATA_NORMALIZATION_PLAN.md) and reused by the one-off cleanup of existing rows.
 *
 * User decisions (2026-11-20):
 *   - Phones are stored as E.164, Egyptian mobiles as "+201XXXXXXXXX".
 *   - Person names: only names typed entirely in lower case or ALL CAPS (or with stray spaces)
 *     are re-cased; a name typed in mixed case is kept exactly as typed.
 *   - Nationality is one value from a fixed list.
 */

// ---------------------------------------------------------------- phones

/**
 * Normalize a phone number to E.164, or return null when it is not a usable number.
 *
 * Egyptian mobiles in any shape seen in the data become "+201XXXXXXXXX":
 *   01012345678, +201012345678, 201012345678, 00201012345678, 1012345678 (leading 0 lost),
 *   and "+1012345678" (a local number typed with a plus, seen in legacy rows).
 * Egyptian landlines ("+20" + area code 2 to 9) and other international numbers written with
 * "+" or "00" (8 to 15 digits) are kept as E.164. Placeholders such as "+20000000099" and
 * "010000000NN" are rejected.
 */
export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const hasPlus = s.startsWith("+");
  let digits = s.replace(/\D+/g, "");
  if (!digits) return null;

  // Egyptian mobile.
  const eg = /^(?:0020|20|0)?(1[0125]\d{8})$/.exec(digits);
  if (eg && (!hasPlus || digits.startsWith("20") || digits.length === 10)) {
    if (/^1[0125]0{6}/.test(eg[1])) return null; // placeholder 010000000NN
    return `+20${eg[1]}`;
  }

  // International: "+" or "00" prefix only.
  if (!hasPlus && digits.startsWith("00")) digits = digits.slice(2);
  else if (!hasPlus) return null;
  if (digits.startsWith("0") || digits.length < 8 || digits.length > 15) return null;
  // A "+20" number that is not a mobile must be a landline with a real area code.
  if (digits.startsWith("20") && !/^20[2-9]\d{7,8}$/.test(digits)) return null;
  return `+${digits}`;
}

/** Last 10 digits: a format-independent key for comparing stored numbers of any vintage. */
export function phoneMatchKey(raw: unknown): string {
  return String(raw ?? "").replace(/\D+/g, "").slice(-10);
}

/** SQL expression giving the same key for a column, e.g. phoneKeySql('"phoneNum"'). */
export function phoneKeySql(column: string): string {
  return `right(regexp_replace(${column}, '[^0-9]+', '', 'g'), 10)`;
}

/** "+201012345678" -> "0101 234 5678" for display; other numbers are returned unchanged. */
export function formatPhoneForDisplay(e164: string | null | undefined): string {
  const s = String(e164 ?? "");
  const m = /^\+20(1\d{2})(\d{3})(\d{4})$/.exec(s);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : s;
}

// ---------------------------------------------------------------- names

/** "abd el-rahman o'neil" -> "Abd El-Rahman O'Neil" (Latin letters only; Arabic is untouched). */
function properCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-'(])([a-z])/g, (_m, pre: string, c: string) => pre + c.toUpperCase());
}

/**
 * Trim and collapse spaces; re-case only when the Latin letters are all lower case or all upper
 * case. "hady mohamed hesham" -> "Hady Mohamed Hesham", "AHMED ALI" -> "Ahmed Ali",
 * "AbdelRahman El Sayed" stays as typed. Names without Latin letters are only trimmed.
 */
export function normalizePersonName(raw: unknown): string {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  const latin = s.replace(/[^A-Za-z]/g, "");
  if (latin.length < 2) return s;
  if (latin === latin.toLowerCase() || latin === latin.toUpperCase()) return properCase(s);
  return s;
}

// ---------------------------------------------------------------- nationality

/** The fixed list (English demonyms). Keep in sync with NeuroLogBookFront/src/lib/nationalities.ts. */
export const NATIONALITIES: readonly string[] = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian",
  "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian",
  "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Botswanan",
  "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian",
  "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese",
  "Colombian", "Comorian", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech",
  "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian", "Egyptian", "Emirati", "Equatorial Guinean",
  "Eritrean", "Estonian", "Eswatini", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
  "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean",
  "Guinea-Bissauan", "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian",
  "Iranian", "Iraqi", "Irish", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh",
  "Kenyan", "Kuwaiti", "Kyrgyz", "Lao", "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian",
  "Luxembourgish", "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian",
  "Mauritian", "Mexican", "Moldovan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Namibian",
  "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "North Macedonian",
  "Norwegian", "Omani", "Pakistani", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan",
  "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saudi", "Senegalese",
  "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Somali",
  "South African", "South Korean", "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese",
  "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Trinidadian",
  "Tunisian", "Turkish", "Turkmen", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan",
  "Vietnamese", "Yemeni", "Zambian", "Zimbabwean",
];

/** Spellings seen in the data and country names people type instead of the nationality. */
const NATIONALITY_ALIASES: Record<string, string> = {
  egypt: "Egyptian", egyption: "Egyptian", egyptien: "Egyptian", egyptain: "Egyptian",
  sudan: "Sudanese", somalian: "Somali", somalia: "Somali", libya: "Libyan", iraq: "Iraqi",
  syria: "Syrian", jordan: "Jordanian", yemen: "Yemeni", palestine: "Palestinian",
  "saudi arabia": "Saudi", "saudi arabian": "Saudi", uae: "Emirati", emirates: "Emirati",
  india: "Indian", bangladesh: "Bangladeshi", maldives: "Maldivian", guinea: "Guinean",
  nigeria: "Nigerian", pakistan: "Pakistani", morocco: "Moroccan", tunisia: "Tunisian",
  algeria: "Algerian", lebanon: "Lebanese", kuwait: "Kuwaiti", oman: "Omani", qatar: "Qatari",
  bahrain: "Bahraini", malaysia: "Malaysian", indonesia: "Indonesian", afghanistan: "Afghan",
  "united kingdom": "British", uk: "British", usa: "American", "united states": "American",
};

const NATIONALITY_BY_LOWER = new Map(NATIONALITIES.map((n) => [n.toLowerCase(), n]));

/** Canonical list value for any accepted spelling, or null when it is not recognised. */
export function canonicalNationality(raw: unknown): string | null {
  const key = String(raw ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!key) return null;
  return NATIONALITY_BY_LOWER.get(key) ?? NATIONALITY_ALIASES[key] ?? null;
}
