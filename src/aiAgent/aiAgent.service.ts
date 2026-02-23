import { injectable } from "inversify";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromText,
  createPartFromBase64,
} from "@google/genai";

@injectable()
export class AiAgentService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      // Use v1 API version for stability (default is v1beta)
      const apiVersion = process.env.GEMINI_API_VERSION || "v1";
      this.genAI = new GoogleGenAI({
        apiKey: apiKey,
        apiVersion: apiVersion as "v1" | "v1beta" | "v1alpha"
      });
    }
  }

  public async generateText(prompt: string): Promise<string> | never {
    try {
      if (!this.genAI) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      // Use environment variable if set, otherwise default to gemini-2.5-flash
      // Valid model names: gemini-2.5-flash, gemini-2.5-pro, gemini-1.5-pro, gemini-1.5-flash
      const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
      
      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: prompt
      });

      if (!response.text) {
        throw new Error("No response generated from AI model");
      }

      return response.text;
    } catch (err: any) {
      throw new Error(err.message || "Failed to generate text from AI");
    }
  }

  /**
   * Multimodal: send text prompt + audio (base64) to Gemini and return generated text.
   * Used for voice-based surgical notes (transcribe + contextualize).
   */
  public async generateContentFromAudioAndText(
    prompt: string,
    audioBase64: string,
    mimeType: string
  ): Promise<string> | never {
    try {
      if (!this.genAI) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
      const contents = createUserContent([
        createPartFromText(prompt),
        createPartFromBase64(audioBase64, mimeType),
      ]);

      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents,
      });

      if (!response.text) {
        throw new Error("No response generated from AI model");
      }

      return response.text;
    } catch (err: any) {
      const message = err?.message || err?.toString?.() || "Failed to generate content from audio and text";
      throw new Error(message);
    }
  }
}

