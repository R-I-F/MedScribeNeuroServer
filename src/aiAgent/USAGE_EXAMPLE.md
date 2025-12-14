# AI Agent Usage Example

The `AiAgentProvider` can be injected into any provider or controller that needs to generate surgical notes from submission data.

## Basic Usage

```typescript
import { inject, injectable } from "inversify";
import { AiAgentProvider } from "./aiAgent.provider";
import { ISubDoc } from "../sub/interfaces/sub.interface";

@injectable()
export class ExampleProvider {
  constructor(
    @inject(AiAgentProvider) private aiAgentProvider: AiAgentProvider
  ) {}

  public async generateNotesForSubmission(submission: ISubDoc): Promise<string> {
    try {
      // Ensure submission is populated with all required fields
      // (candDocId, procDocId, supervisorDocId, mainDiagDocId, procCptDocId, icdDocId)
      
      const result = await this.aiAgentProvider.generateSurgicalNotes({
        submission: submission
      });

      return result.surgicalNotes;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }
}
```

## Example: Using in SubProvider

```typescript
// In sub.provider.ts
import { AiAgentProvider } from "../aiAgent/aiAgent.provider";

@injectable()
export class SubProvider {
  constructor(
    @inject(AiAgentProvider) private aiAgentProvider: AiAgentProvider,
    // ... other dependencies
  ) {}

  public async generateSurgicalNotesForSubmission(
    submissionId: string
  ): Promise<string> | never {
    try {
      // Get populated submission
      const submission = await this.subService.getSubById(submissionId);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Generate surgical notes
      const result = await this.aiAgentProvider.generateSurgicalNotes({
        submission: submission
      });

      return result.surgicalNotes;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }
}
```

## Important Notes

1. **Populated Submissions**: The submission must be populated with all referenced documents:
   - `candDocId` (candidate)
   - `procDocId` (procedure with hospital and arabProc)
   - `supervisorDocId` (supervisor)
   - `mainDiagDocId` (main diagnosis)
   - `procCptDocId` (CPT codes)
   - `icdDocId` (ICD codes)

2. **Environment Variables**: 
   - `GEMINI_API_KEY` (required): Your Google AI Studio API key
   - `GEMINI_MODEL_NAME` (optional): Model to use (default: `gemini-2.5-flash`)
     - Valid options: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-pro`, `gemini-1.5-flash`
   - `GEMINI_API_VERSION` (optional): API version (default: `v1`)
     - Valid options: `v1` (stable), `v1beta` (beta features), `v1alpha` (alpha features)

3. **Error Handling**: The AI agent will throw errors if:
   - `GEMINI_API_KEY` is not configured
   - The API call fails
   - No response is generated

4. **Response Format**: The generated surgical notes are returned as a plain string that can be saved to the submission's `surgNotes` field or used elsewhere.

5. **SDK**: This implementation uses the new `@google/genai` SDK (Google Gen AI SDK) which is the recommended and actively maintained SDK for Gemini API.

