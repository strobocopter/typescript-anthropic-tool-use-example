import dotenv from "dotenv";
import { input } from "@inquirer/prompts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Express } from "express";
dotenv.config();
import { tools, functions, zodSchemas } from "./tools";


function exit() {
  console.log("Ok, bye!");
  process.exit(0);
}

async function query() {
  const query = await input({ message: "Waiting for input..." });
  const trimmedQuery = query.trim();
  
  if (["quit", "exit"].includes(trimmedQuery.toLowerCase())) {
    exit();
  }
  return trimmedQuery;
}

// Add this utility function after the imports
type ContentWrapper = {
  content: Array<{
    type: "text";
    text: string;
  }>;
};

const wrapToolResponse = (result: any): ContentWrapper => {
  return {
    content: result
  };
};

async function main() {
  // Create Express app
  const app: Express = express();
  app.use(express.json());
  
  // Only parse JSON for non-message endpoints
  app.use((req, res, next) => {
    if (req.path !== '/message') {
      express.json()(req, res, next);
    } else {
      next();
    }
  });

  // Set up SSE endpoint with multiple transports
  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const mcpServer = new McpServer({
      name: "Postman Tools",
      version: "1.0.0"
    });
    
    // Register tools for this connection
    for (const tool of tools) {
      const func = functions[tool.name];
      const schema = zodSchemas[tool.name];
      if (func) {
        mcpServer.tool(
          tool.name,
          tool.description || tool.name,
          schema,
          async (...args) => wrapToolResponse(await func(...args))
        );
      }
    }
    
    const transport = new SSEServerTransport("/message", res);
    await mcpServer.connect(transport);
    
    const sessionId = transport.sessionId;
    console.log(`[SSE] New connection established: ${sessionId}`);
    transports.set(sessionId, transport);

    // Handle connection close and cleanup
    req.on('close', async () => {
      console.log(`[SSE] Connection closed: ${sessionId}`);
      await mcpServer.close();
      transports.delete(sessionId);
    });
  });

  app.post("/message", async (req, res) => {
    const sessionId = req.query.sessionId as string;

    const transport = transports.get(sessionId);
    if (!transport) {
      console.log(`[SSE] Error: No transport found for session ${sessionId}`);
      res.status(400).json({ error: "No active transport" });
      return;
    }
    
    try {
      // log incoming message
      //console.log(`[SSE] Received message for ${sessionId}:`, req.body);
      await transport.handlePostMessage(req, res, req.body);
      
    } catch (error) {
      console.error(`[SSE] Error handling message for ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error handling message" });
      }
    }
  });

  // Start the Express server
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
  });

  // Handle server shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  });

  // Continue with existing CLI loop
  while (true) {
    try {
      const userInput = await query();
      if (userInput === "") {
        console.log("Type 'quit' or 'exit' to stop the MCP server.");
        continue;
      }
    } catch (error) {
      console.error('Error waiting for input:', error.message);
      continue;
    }
  }
}

// Start the application with error handling
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

