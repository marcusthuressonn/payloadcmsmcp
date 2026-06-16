import express, { type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;

const SERVER_INFO = {
  name: "payload-cms-mcp",
  version: "2.0.0",
} as const;

const app = express();
app.use(express.json({ limit: "4mb" }));

// Liveness / Railway healthcheck
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", server: SERVER_INFO });
});

/**
 * MCP over Streamable HTTP, stateless mode.
 *
 * Every request gets a fresh McpServer + transport. These tools are pure
 * (validation/codegen), so there is no per-session state to retain — which
 * is exactly why no Redis/session store is needed on a single long-running
 * instance.
 */
app.post("/mcp", async (req: Request, res: Response) => {
  const server = new McpServer(SERVER_INFO);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    registerTools(server);
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// In stateless mode there is no long-lived stream to GET, and no session to
// DELETE. Respond per the MCP spec so clients fail cleanly instead of hanging.
const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

// Static landing page (kept from the original project)
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`Payload CMS MCP server listening on :${PORT}  (POST /mcp)`);
});
