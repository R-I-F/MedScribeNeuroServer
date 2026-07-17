import { inject, injectable } from "inversify";
import { AiAgentService } from "../aiAgent/aiAgent.service";

export interface IBilingualName {
  ar: string | null;
  en: string | null;
}

/**
 * Bilingual patient-name pipeline (parent plan §6 + bilingual-titles plan §3).
 *
 * Names are stored in the privacy format `complete-first-name + single-letter initials`
 * ("أحمد م خ"). Whole-string AI transliteration sometimes fused the initials ("Ahmed Mkh"),
 * so the structure is enforced in code, not the prompt: Gemini transliterates ONLY the word
 * tokens; single-letter initials map through a fixed deterministic digraph table, giving
 * "أحمد م خ" → "Ahmed M Kh" by construction.
 *
 * Failure containment unchanged: on AI failure the typed-language slot is still filled and
 * the other stays NULL (backfillable) — saving a surgery never blocks on Gemini.
 */
@injectable()
export class PatientNameService {
  constructor(@inject(AiAgentService) private aiAgentService: AiAgentService) {}

  public static isArabic(s: string): boolean {
    return /[؀-ۿ]/.test(s ?? "");
  }

  /** Egyptian-romanization initials table (plan Q7, delegated; ج=G per project convention). */
  private static readonly AR_INITIAL_TO_EN: Record<string, string> = {
    "ا": "A", "أ": "A", "إ": "E", "آ": "A", "ء": "A", "ؤ": "W", "ئ": "Y", "ى": "A",
    "ب": "B", "ت": "T", "ث": "Th", "ج": "G", "ح": "H", "خ": "Kh", "د": "D", "ذ": "Dh",
    "ر": "R", "ز": "Z", "س": "S", "ش": "Sh", "ص": "S", "ض": "D", "ط": "T", "ظ": "Z",
    "ع": "A", "غ": "Gh", "ف": "F", "ق": "K", "ك": "K", "ل": "L", "م": "M", "ن": "N",
    "ه": "H", "ة": "H", "و": "W", "ي": "Y",
  };

  /** Latin initial → Arabic letter (EN-typed names; stored initials are single Latin letters). */
  private static readonly EN_INITIAL_TO_AR: Record<string, string> = {
    A: "أ", B: "ب", C: "ك", D: "د", E: "إ", F: "ف", G: "ج", H: "ه", I: "إ", J: "ج",
    K: "ك", L: "ل", M: "م", N: "ن", O: "أ", P: "ب", Q: "ق", R: "ر", S: "س", T: "ت",
    U: "أ", V: "ف", W: "و", X: "س", Y: "ي", Z: "ز",
  };

  /** A token is a privacy initial when it is exactly one character (formatPatientNameForStore output). */
  private static isInitialToken(token: string): boolean {
    return token.length === 1;
  }

  /** Deterministic initial mapping; null = unmappable character (name then fails safe → slot NULL). */
  private static mapInitial(token: string, to: "ar" | "en"): string | null {
    if (to === "en") {
      if (/[A-Za-z]/.test(token)) return token.toUpperCase();
      return PatientNameService.AR_INITIAL_TO_EN[token] ?? null;
    }
    if (PatientNameService.isArabic(token)) return token;
    return PatientNameService.EN_INITIAL_TO_AR[token.toUpperCase()] ?? null;
  }

  /** Zero-AI part of the pipeline: fill ONLY the typed-language slot (instant-save path, §3.6). */
  public typedSlot(rawName: string): IBilingualName {
    const name = (rawName ?? "").trim();
    if (!name) return { ar: null, en: null };
    return PatientNameService.isArabic(name) ? { ar: name, en: null } : { ar: null, en: name };
  }

  /** Resolve both slots for one typed name (AI only for the word tokens). */
  public async bilingual(rawName: string): Promise<IBilingualName> {
    const name = (rawName ?? "").trim();
    if (!name) return { ar: null, en: null };
    const typedIsArabic = PatientNameService.isArabic(name);
    try {
      const map = await this.transliterateBatch([name], typedIsArabic ? "en" : "ar");
      const other = map.get(name.replace(/\s+/g, " ")) ?? null;
      return typedIsArabic ? { ar: name, en: other } : { ar: other, en: name };
    } catch {
      return typedIsArabic ? { ar: name, en: null } : { ar: null, en: name };
    }
  }

  /**
   * Batch transliteration (ETL/backfill workhorse), initials-aware: distinct names in,
   * Map(normalized original → transliterated) out. Gemini sees ONLY the word tokens;
   * initials are mapped locally, so the privacy structure survives by construction.
   */
  public async transliterateBatch(names: string[], to: "ar" | "en"): Promise<Map<string, string>> {
    const distinct = [...new Set(names.map((n) => (n ?? "").trim().replace(/\s+/g, " ")).filter(Boolean))];
    const out = new Map<string, string>();
    if (distinct.length === 0) return out;

    const wordTokens = new Set<string>();
    for (const name of distinct) {
      for (const token of name.split(" ")) {
        if (!PatientNameService.isInitialToken(token)) wordTokens.add(token);
      }
    }
    const wordMap = await this.transliterateWords([...wordTokens], to);

    for (const name of distinct) {
      const parts = name
        .split(" ")
        .map((token) =>
          PatientNameService.isInitialToken(token)
            ? PatientNameService.mapInitial(token, to)
            : wordMap.get(token) ?? null
        );
      if (parts.every((p): p is string => !!p)) out.set(name, parts.join(" "));
    }
    return out;
  }

  /** One Gemini call per batch of distinct WORD tokens. Strict-JSON prompt, defensively parsed. */
  private async transliterateWords(words: string[], to: "ar" | "en"): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (words.length === 0) return out;

    const target = to === "ar" ? "Arabic script" : "Latin (English) script";
    const prompt =
      `Transliterate the following Egyptian personal name words into ${target}. ` +
      `These are people's names — transliterate the sound, do not translate meanings. ` +
      `Return ONLY a JSON array of strings, exactly ${words.length} items, same order as given, no markdown, no commentary.\n` +
      JSON.stringify(words);

    const text = await this.aiAgentService.generateText(prompt);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr) || arr.length !== words.length) {
      throw new Error(`transliteration batch shape mismatch: sent ${words.length}, got ${Array.isArray(arr) ? arr.length : typeof arr}`);
    }
    words.forEach((original, i) => {
      const v = typeof arr[i] === "string" ? arr[i].trim() : "";
      if (v) out.set(original, v);
    });
    return out;
  }
}
