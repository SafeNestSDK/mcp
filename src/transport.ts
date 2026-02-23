import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';

export type TransportMode = 'http' | 'stdio';

export function getTransportMode(): TransportMode {
  const env = process.env.TUTELIQ_MCP_TRANSPORT?.toLowerCase();
  if (env === 'stdio') return 'stdio';
  return 'http';
}

export async function startStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tuteliq MCP server running on stdio');
}

export function createHttpHandler(server: McpServer) {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  return async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'POST') {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });

      transport.onclose = () => {
        const id = [...transports.entries()].find(([, t]) => t === transport)?.[0];
        if (id) transports.delete(id);
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } else if (req.method === 'GET') {
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID' });
        return;
      }
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    } else if (req.method === 'DELETE') {
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
        transports.delete(sessionId);
      } else {
        res.status(400).json({ error: 'Invalid or missing session ID' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  };
}
