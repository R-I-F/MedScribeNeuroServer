import { inject, injectable } from "inversify";
import { AiAgentService } from "../aiAgent/aiAgent.service";

export interface IBilingualName {
  ar: string | null;
  en: string | null;
}

/**
 * Bilingual patient-name pipeline (plan §6). Language DETECTION is a free script test;
 * only producing the OTHER slot costs a Gemini call (transliteration of personal names).
 * Failure containment: on AI failure the typed-language slot is still filled and the other
 * stays NULL (backfillable) — saving a surgery never blocks on Gemini.
 */
@injectable()
export class PatientNameService {
  constructor(@inject(AiAgentService) private aiAgentService: AiAgentService) {}

  public static isArabic(s: string): boolean {
    return /[؀-ۿ]/.test(s ?? "");
  }

  /** Resolve both slots for one typed name. */
  public async bilingual(rawName: string): Promise<IBilingualName> {
    const name = (rawName ?? "").trim();
    if (!name) return { ar: null, en: null };
    const typedIsArabic = PatientNameService.isArabic(name);
    try {
      const map = await this.transliterateBatch([name], typedIsArabic ? "en" : "ar");
      const other = map.get(name) ?? null;
      return typedIsArabic ? { ar: name, en: other } : { ar: other, en: name };
    } catch {
      return typedIsArabic ? { ar: name, en: null } : { ar: null, en: name };
    }
  }

  /**
   * Batch transliteration (ETL workhorse): distinct names in, Map(original → transliterated)
   * out. One Gemini call per batch (~50 names). Strict-JSON prompt, defensively parsed.
   */
  public async transliterateBatch(names: string[], to: "ar" | "en"): Promise<Map<string, string>> {
    const distinct = [...new Set(names.map((n) => (n ?? "").trim()).filter(Boolean))];
    const out = new Map<string, string>();
    if (distinct.length === 0) return out;

    const target = to === "ar" ? "Arabic script" : "Latin (English) script";
    const prompt =
      `Transliterate the following Egyptian personal names into ${target}. ` +
      `These are people's names — transliterate the sound, do not translate meanings. ` +
      `Return ONLY a JSON array of strings, exactly ${distinct.length} items, same order as given, no markdown, no commentary.\n` +
      JSON.stringify(distinct);

    const text = await this.aiAgentService.generateText(prompt);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr) || arr.length !== distinct.length) {
      throw new Error(`transliteration batch shape mismatch: sent ${distinct.length}, got ${Array.isArray(arr) ? arr.length : typeof arr}`);
    }
    distinct.forEach((original, i) => {
      const v = typeof arr[i] === "string" ? arr[i].trim() : "";
      if (v) out.set(original, v);
    });
    return out;
  }
}
