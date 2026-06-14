import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { DiagnosisSearchService } from "../diagnosis/diagnosisSearch.service";
import { createMcpServer } from "./mcp.server";

/**
 * MCP endpoint (Streamable HTTP, stateless).
 *
 * Mounted at /mcp. Authenticated platform users (extractJWT: auth cookie or Bearer JWT)
 * can call the `search_diagnosis` tool. The departmentId is supplied as a tool argument
 * in the request body — it is never derived from the auth token.
 *
 * Stateless: a fresh McpServer + transport is created per request (no sessions/SSE),
 * so GET and DELETE are not supported.
 */
@injectable()
export class McpRouter {
  public router: Router;

  constructor(
    @inject(DiagnosisSearchService) private diagnosisSearchService: DiagnosisSearchService
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      extractJWT,
      userBasedRateLimiter,
      async (req: Request, res: Response) => {
        // Stateless transport: one server + transport per request.
        const server = createMcpServer(this.diagnosisSearchService);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        res.on("close", () => {
          transport.close();
          server.close();
        });

        try {
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } catch (err: any) {
          console.error("[McpRouter] MCP request error:", err?.message ?? err);
          if (!res.headersSent) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              jsonrpc: "2.0",
              error: { code: -32603, message: "Internal server error" },
              id: null,
            });
          }
        }
      }
    );

    // Stateless mode does not use server-initiated SSE streams or session teardown.
    const methodNotAllowed = (_req: Request, res: Response) => {
      res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. Use POST." },
        id: null,
      });
    };
    this.router.get("/", methodNotAllowed);
    this.router.delete("/", methodNotAllowed);
  }
}
