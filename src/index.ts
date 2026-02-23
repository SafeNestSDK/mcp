#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tuteliq } from '@tuteliq/sdk';

import { registerDetectionTools } from './tools/detection.js';
import { registerFraudTools } from './tools/fraud.js';
import { registerMediaTools } from './tools/media.js';
import { registerAnalysisTools } from './tools/analysis.js';
import { registerAdminTools } from './tools/admin.js';
import { getTransportMode, startStdio } from './transport.js';

export function createServer(): McpServer {
  const apiKey = process.env.TUTELIQ_API_KEY;
  if (!apiKey) {
    console.error('Error: TUTELIQ_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Tuteliq(apiKey);

  const server = new McpServer({
    name: 'tuteliq-mcp',
    version: '3.0.0',
  });

  // Register all tool groups
  registerDetectionTools(server, client);
  registerFraudTools(server, client);
  registerMediaTools(server, client);
  registerAnalysisTools(server, client);
  registerAdminTools(server, client);

  return server;
}

// Direct execution: stdio mode
if (getTransportMode() === 'stdio') {
  const server = createServer();
  startStdio(server).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
