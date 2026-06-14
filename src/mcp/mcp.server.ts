import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiagnosisSearchService } from "../diagnosis/diagnosisSearch.service";

/**
 * Builds an MCP server exposing the `search_diagnosis` tool.
 *
 * The search service is passed in (rather than pulled from the IoC container) so this
 * module has no dependency on container.config and we avoid a circular import
 * (container -> mcp.router -> mcp.server -> container).
 *
 * Used in stateless mode: a fresh server is created per request by mcp.router.
 */
export function createMcpServer(searchService: DiagnosisSearchService): McpServer {
  const server = new McpServer({
    name: "medscribe-diagnosis",
    version: "1.0.0",
  });

  server.registerTool(
    "search_diagnosis",
    {
      title: "Search diagnosis by description",
      description:
        "Find the most relevant diagnoses for a department from a free-text description " +
        "(English or Arabic) when the exact ICD name is unknown. Returns each match with its " +
        "ICD code, English/Arabic name and description, a similarity score, and the main " +
        "diagnosis it is linked to within that department.",
      inputSchema: {
        departmentId: z
          .string()
          .uuid()
          .describe("UUID of the department to search within."),
        query: z
          .string()
          .min(2)
          .describe("Free-text description of the diagnosis (English or Arabic)."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Maximum number of matches to return (default 5)."),
      },
    },
    async ({ departmentId, query, limit }) => {
      const results = await searchService.searchByDepartment(
        departmentId,
        query,
        limit ?? 5
      );

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No matching diagnoses found for the given department.`,
            },
          ],
          structuredContent: { results },
        };
      }

      const summary = results
        .map((r, i) => {
          const mains =
            r.mainDiagnoses.length > 0
              ? r.mainDiagnoses.map((m) => m.title).join(", ")
              : "(none linked for this department)";
          return (
            `${i + 1}. ${r.icdName} [${r.icdCode}] — ${(r.similarity * 100).toFixed(1)}% match\n` +
            `   Arabic: ${r.icdArName}\n` +
            `   Main diagnosis: ${mains}\n` +
            `   ${r.description}`
          );
        })
        .join("\n\n");

      return {
        content: [{ type: "text" as const, text: summary }],
        structuredContent: { results },
      };
    }
  );

  return server;
}
