import { inject, injectable } from "inversify";
import { AiAgentService } from "../aiAgent/aiAgent.service";

/**
 * Procedure-phrase TRANSLATION (bilingual-titles plan §2.2) — unlike patient names
 * (transliterated sound-for-sound), the clerk's procedure phrase is translated
 * meaning-for-meaning, in the user-decided register (Q1): literal but clinical —
 * "ورم بالمخ" → "brain tumour", never normalized to a formal catalog name.
 */
@injectable()
export class ProcPhraseService {
  constructor(@inject(AiAgentService) private aiAgentService: AiAgentService) {}

  public static isArabic(s: string): boolean {
    return /[؀-ۿ]/.test(s ?? "");
  }

  /**
   * Batch translation: distinct phrases in, Map(normalized original → translation) out.
   * One Gemini call per batch (~50 phrases). Strict-JSON prompt, defensively parsed.
   */
  public async translateBatch(phrases: string[], to: "ar" | "en"): Promise<Map<string, string>> {
    const distinct = [...new Set(phrases.map((p) => (p ?? "").trim().replace(/\s+/g, " ")).filter(Boolean))];
    const out = new Map<string, string>();
    if (distinct.length === 0) return out;

    const target = to === "ar" ? "Arabic" : "English";
    const prompt =
      `Translate the following surgical procedure phrases into ${target}. ` +
      `Translate the meaning literally and keep the clinical register — do NOT normalize to formal ` +
      `catalog/CPT names and do NOT add detail that is not in the phrase. Keep each translation short. ` +
      `Return ONLY a JSON array of strings, exactly ${distinct.length} items, same order as given, no markdown, no commentary.\n` +
      JSON.stringify(distinct);

    const text = await this.aiAgentService.generateText(prompt);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr) || arr.length !== distinct.length) {
      throw new Error(`phrase-translation batch shape mismatch: sent ${distinct.length}, got ${Array.isArray(arr) ? arr.length : typeof arr}`);
    }
    distinct.forEach((original, i) => {
      const v = typeof arr[i] === "string" ? arr[i].trim() : "";
      if (v) out.set(original, v);
    });
    return out;
  }
}
